// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import pgPromise from "pg-promise"
import { config } from "../config"
import migrationDb, { pgp } from "../db/db"
import { FileDescriptor, ImportOptions, TableDescriptor, TypeMapping } from "../types"
import { FixScriptDescriptor } from "../types/internal"
import { errorCodes } from "../util/error"
import { createGenericTableQueryFromDescriptor, runQueryFile } from "../util/queryTools"
import { time, timeEnd } from "../util/timing"

export const importFileData = async (files: FileDescriptor[], options: ImportOptions) => {
    return await migrationDb.tx(async (t) => {
        const tables = files.map(f => f.table)
        const tableResult = await createTables(tables, t)
        const tableInserts: any[] = [];
        time("** Data inserts total")
        for await (const f of files) {
            time(`Table '${f.table.tableName}' inserts`)
            const insertResult = await insertData(f.table, f.data, f.mapping, options, t)
            timeEnd(`Table '${f.table.tableName}' inserts`)
            tableInserts.push(insertResult)
        }
        timeEnd("** Data inserts total")
        return { tables: tableResult, inserts: tableInserts }
    })
}

export const createTables = async (tables: TableDescriptor[], t: pgPromise.ITask<{}>) => {
    const sqls: string[] = tables.map(t => {
        const tqf = t.tableQueryFunction ?? createGenericTableQueryFromDescriptor
        return tqf(t)
    })
    await Promise.all(sqls.map(s => t.none(s)))
    return tables.map(t => t.tableName)
}

const parseTableDataTypes = (tableName: string, data: any[], mapping: TypeMapping): any[] => {
    //TODO: now data is dynamically transformed by parsing it, a more consistent and error safe way would be to pick and parse data based on mapping
    // and consequently catch missing required fields before insert failure
    const parsedDataSet =
        data.map(row => {
            const parsedRow: any = {}
            Object.keys(row).forEach((key) => {
                const dataItem = row[key]
                const columnKey = key.toLowerCase()
                //Non-flat data shoud appear as arrays (dependent on the XML-parser option arrayMode)
                if (typeof dataItem === "object") {
                    throw new Error(`Data of column '${key}' in table '${tableName}' is not flat table data (${errorCodes.nonFlatData}): ${JSON.stringify(dataItem)}`)
                }
                const columnParser = mapping[tableName].columns[columnKey]?.parser
                if (columnParser !== undefined) {
                    parsedRow[columnKey] = columnParser(dataItem)
                } else {
                    throw new Error(`Missing parsing instructions for table: ${tableName}, column: ${key}`)
                }
            })
            return parsedRow
        })
    return parsedDataSet
}

export const insertData = async (table: TableDescriptor, data: any[], mapping: TypeMapping, options: ImportOptions, t: pgPromise.ITask<{}>) => {
    const cs = new pgp.helpers.ColumnSet(
        Object.keys(table.columns),
        { table: { table: table.tableName, schema: config.migrationSchema } }
    );
    const parsedData = parseTableDataTypes(table.tableName, data, mapping)
    const insert = pgp.helpers.insert(parsedData, cs);
    let resultReturningQuery = options.returnAll ?
        `WITH rows AS ( ${insert} RETURNING *) select * from rows;` :
        `WITH rows AS ( ${insert} RETURNING 1) select count(*) as ${table.tableName}_count from rows;`
    return await t.any(resultReturningQuery)
}

export const executePostImportFixes = async (cityFixScripts: FixScriptDescriptor[]) => {
    migrationDb.tx(async (t) => {
        for (let fix of cityFixScripts) {
            await runQueryFile(fix.filePath, t, fix.parameters);
        }
    })
}
// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import pgPromise from "pg-promise"
import { config } from "../config"
import { pgp } from "../db/db"
import { createGenericTableAndViewQueryFromDescriptor } from "../db/tables"
import { FileDescriptor, ImportOptions, ImportType, PartitionImportOptions, TableDescriptor, TypeMapping } from "../types"
import { errorCodes } from "../util/error"
import { createGenericTableQueryFromDescriptor } from "../util/queryTools"
import { time, timeEnd } from "../util/timing"

export const importFileData = async (t: pgPromise.ITask<{}>, files: FileDescriptor[], options: ImportOptions) => {
    const tableResult = await createTables(files, t)
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
}

export const importFileDataWithExistingTx = async (files: FileDescriptor[], options: PartitionImportOptions, t: pgPromise.ITask<{}>) => {
    const tableResult = await createTables(files, t)
    const tableInserts: any[] = [];

    for await (const f of files) {
        const insertResult = await insertData(f.table, f.data, f.mapping, { ...options, returnAll: false }, t)
        tableInserts.push(insertResult)
    }
    return { tables: tableResult, inserts: tableInserts }
}

export const createTables = async (files: FileDescriptor[], t: pgPromise.ITask<{}>) => {
    const sqls: string[] = files.map(f => {
        const tqf = f.table.tableQueryFunction ?
            f.table.tableQueryFunction : f.importType === ImportType.Effica ?
                createGenericTableAndViewQueryFromDescriptor : createGenericTableQueryFromDescriptor
        return tqf(f.table)
    })
    await Promise.all(sqls.map(s => t.none(s)))
    return files.map(t => t.table.tableName)
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

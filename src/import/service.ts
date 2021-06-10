import pgPromise from "pg-promise"
import { config } from "../config"
import migrationDb, { pgp } from "../db/db"
import { sqlTypeMapping } from "../mapping"
import { time, timeEnd } from "../timing"
import { FileDescriptor, ImportOptions, TableDescriptor } from "../types"
import { errorCodes } from "../util"


export const importXmlData = async (files: FileDescriptor[], options: ImportOptions) => {
    return await migrationDb.tx(async (t) => {
        const tables = files.map(f => f.table)
        const tableResult = await createTables(tables, t)
        const tableInserts: any[] = [];
        time("** Data inserts total")
        for await (const f of files) {
            time(`Table '${f.table.tableName}' inserts`)
            const insertResult = await insertData(f.table, f.data, options, t)
            timeEnd(`Table '${f.table.tableName}' inserts`)
            tableInserts.push(insertResult)
        }
        timeEnd("** Data inserts total")
        return { tables: tableResult, inserts: tableInserts }
    })
}

export const createTables = async (tables: TableDescriptor[], t: pgPromise.ITask<{}>) => {
    const sqls: string[] = tables.map(
        table => `CREATE TABLE IF NOT EXISTS 
        ${config.migrationSchema ? config.migrationSchema + "." : ""}
        ${table.tableName} 
        (${table.columns.map(c => `${c.columnName} ${c.sqlType}`).join(",")});`)
    await Promise.all(sqls.map(s => t.none(s)))
    return tables.map(t => t.tableName)
}

const parseTableDataTypes = (tableName: string, data: any[]): any[] => {
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
                const columnParser = sqlTypeMapping[tableName][columnKey]?.parser
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

export const insertData = async (table: TableDescriptor, data: any[], options: ImportOptions, t: pgPromise.ITask<{}>) => {
    const cs = new pgp.helpers.ColumnSet(
        table.columns.map(c => c.columnName),
        { table: { table: table.tableName, schema: config.migrationSchema } }
    );
    const parsedData = parseTableDataTypes(table.tableName, data)
    const insert = pgp.helpers.insert(parsedData, cs);
    let resultReturningQuery = options.returnAll ?
        `WITH rows AS ( ${insert} RETURNING *) select * from rows;` :
        `WITH rows AS ( ${insert} RETURNING 1) select count(*) as ${table.tableName}_count from rows;`
    return await t.any(resultReturningQuery)
}
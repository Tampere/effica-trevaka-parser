import migrationDb, { pgp } from "./db/db";
import { ImportOptions, TableDescriptor } from "./types";
import { config } from "./config"
import { sqlTypeMapping } from "./mapping";

export const createTables = async (tables: TableDescriptor[]): Promise<any> => {
    return await migrationDb.tx(async (t) => {
        const sqls: string[] = tables.map(table => `CREATE TABLE IF NOT EXISTS ${config.migrationSchema ? config.migrationSchema + "." : ""}${table.tableName} (${table.columns.map(c => `${c.columnName} ${c.sqlType}`).join(",")});`)
        await Promise.all(sqls.map(s => t.none(s).catch(err => console.error(err))))

        return tables.map(t => t.tableName)
    })
}

const parseTableDataTypes = (tableName: string, data: any[]): any[] => {
    data.forEach(row => {
        Object.keys(row).forEach((key) => {
            const columnParser = sqlTypeMapping[tableName][key]?.parser
            if (columnParser !== undefined) {
                row[key] = columnParser(row[key])
            } else {
                throw new Error(`Missing parsing instructions for table: ${tableName}, column: ${key}`)
            }
        })
    })
    return data
}

export const insertData = async (table: TableDescriptor, data: any[], options: ImportOptions): Promise<any> => {
    return await migrationDb.tx(async (t) => {

        const cs = new pgp.helpers.ColumnSet(table.columns.map(c => c.columnName), { table: { table: table.tableName, schema: config.migrationSchema } });
        
        const insert = pgp.helpers.insert(parseTableDataTypes(table.tableName, data), cs);
        let countQuery = options.returnAll ?
            `WITH rows AS ( ${insert} RETURNING *) select * from rows;` :
            `WITH rows AS ( ${insert} RETURNING 1) select count(*) as ${table.tableName}_count from rows;`
        return t.any(countQuery)
    })
}
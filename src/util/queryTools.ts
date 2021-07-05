import pgPromise, { QueryFile } from "pg-promise"
import { config } from "../config"
import db from "../db/db"

export const wrapWithReturning = (tableName: string, insertQuery: string, isDataReturned: boolean = false, orderByFields: string[] = []) => {
    return isDataReturned ?
        `WITH rows AS ( ${insertQuery} RETURNING *) select * from rows ${createOrderBy(orderByFields)};` :
        `WITH rows AS ( ${insertQuery} RETURNING 1) select count(*) as ${tableName}_count from rows;`
}

export const runQueryFile = async (path: string, t: pgPromise.ITask<{}>, isDataReturned: boolean = false) => {
    const queryFile = new QueryFile(path)
    return isDataReturned ? await t.any(queryFile) : await t.none(queryFile)
}

export const runQuery = async (query: string, t: pgPromise.ITask<{}>, isDataReturned: boolean = false) => {
    return isDataReturned ? await t.any(query) : await t.none(query)
}

export const dropTable = async (tableName: string, t?: pgPromise.ITask<{}>) => {
    const query = `DROP TABLE IF EXISTS ${getMigrationSchema()}${tableName};`
    if (!t) {
        return await db.tx(async t => t.any(query))
    } else {
        return await t.any(query)
    }

}

export const getMigrationSchema = () => config.migrationSchema ? `${config.migrationSchema}.` : ""
export const getExtensionSchema = () => config.extensionSchema ? `${config.extensionSchema}.` : ""
export const createOrderBy = (orderByFields: string[]) => orderByFields.length > 0 ? `ORDER BY ${orderByFields.join(" ,")} ` : "" 
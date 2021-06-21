import pgPromise, { QueryFile } from "pg-promise"
import { config } from "../config"

export const wrapWithReturning = (tableName: string, insertQuery: string, isDataReturned: boolean = false) => {
    return isDataReturned ?
        `WITH rows AS ( ${insertQuery} RETURNING *) select * from rows;` :
        `WITH rows AS ( ${insertQuery} RETURNING 1) select count(*) as ${tableName}_count from rows;`
}

export const runQueryFile = async (path: string, t: pgPromise.ITask<{}>, isDataReturned: boolean = false) => {
    const queryFile = new QueryFile(path)
    return isDataReturned ? await t.any(queryFile) : await t.none(queryFile)
}

export const runQuery = async (query: string, t: pgPromise.ITask<{}>, isDataReturned: boolean = false) => {
    return isDataReturned ? await t.any(query) : await t.none(query)
}

export const getMigrationSchema = () => config.migrationSchema ? `${config.migrationSchema}.` : ""
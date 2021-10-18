// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { join as joinPath } from "path"
import pgPromise, { QueryFile } from "pg-promise"
import { config } from "../config"
import db from "../db/db"
import { TableDescriptor } from "../types"
import { EfficaIncomeCodeMapping } from "../types/mappings"

export const baseQueryParameters = {
    migrationSchema: config.migrationSchema,
    extensionSchema: config.extensionSchema,
};

export const wrapWithReturning = (tableName: string, insertQuery: string, isDataReturned: boolean = false, orderByFields: string[] = []) => {
    return isDataReturned ?
        `WITH rows AS ( ${insertQuery} RETURNING *) select * from rows ${createOrderBy(orderByFields)};` :
        `WITH rows AS ( ${insertQuery} RETURNING 1) select count(*) as ${tableName}_count from rows;`
}

export const selectFromTable = (tableName: string, schema: string = "", isDataReturned: boolean = false, orderByFields: string[] = []) => {
    const tablePrefix = schema.length > 0 ? `${schema}.` : ""
    return isDataReturned ?
        `SELECT * FROM ${tablePrefix}${tableName} ${createOrderBy(orderByFields)}` :
        `SELECT COUNT(*) AS ${tableName}_count FROM ${tablePrefix}${tableName}`
}

const queryFileCache: Record<string, QueryFile> = {}

export const runQueryFile = async (path: string, t: pgPromise.ITask<{}>, values: any = {}, isDataReturned: boolean = false) => {
    let queryFile = queryFileCache[path];
    if (!queryFile) {
        const fullPath = joinPath(__dirname, "sql", path);
        queryFile = new QueryFile(fullPath);
        queryFileCache[path] = queryFile;
    }
    return isDataReturned ? await t.any(queryFile, values) : await t.none(queryFile, values)
}

export const runQuery = async (query: string, t: pgPromise.ITask<{}>, isDataReturned: boolean = false, values: any = {}) => {
    return isDataReturned ? await t.any(query, values) : await t.none(query, values)
}

export const dropTable = async (tableName: string, t?: pgPromise.ITask<{}>) => {
    const query = `DROP TABLE IF EXISTS ${getMigrationSchemaPrefix()}${tableName} CASCADE;`
    if (!t) {
        return await db.tx(async t => t.any(query))
    } else {
        return await t.any(query)
    }

}

export const truncateEvakaTable = async (tableName: string, t?: pgPromise.ITask<{}>) => {
    const query = `TRUNCATE TABLE ${tableName} CASCADE;`
    if (!t) {
        return await db.tx(async t => t.any(query))
    } else {
        return await t.any(query)
    }

}

export const getMigrationSchemaPrefix = () => config.migrationSchema ? `${config.migrationSchema}.` : ""
export const getExtensionSchemaPrefix = () => config.extensionSchema ? `${config.extensionSchema}.` : ""
export const createOrderBy = (orderByFields: string[]) => orderByFields.length > 0 ? `ORDER BY ${orderByFields.join(" ,")} ` : ""

export const createGenericTableQueryFromDescriptor = (td: TableDescriptor): string => {
    const primaryKeyStr = td.primaryKeys !== undefined ? `, PRIMARY KEY (${td.primaryKeys?.join(",")})` : ""
    return `CREATE TABLE IF NOT EXISTS 
        ${getMigrationSchemaPrefix()}
        ${td.tableName} 
        (${Object.keys(td.columns).map(c => `${c} ${td.columns[c].sqlType}`).join(",")}${primaryKeyStr});`
}

export const createSqlConditionalForIncomeCodes = (mappings: EfficaIncomeCodeMapping[]) => {
    return mappings.map(
        p => p.codes.map(
            code => `WHEN ${code} THEN '${p.evakaType}'`
        ).join("\n")
    ).join("\n")
}

export const createTotalSumClauseForIncomeTypes = (mappings: EfficaIncomeCodeMapping[]) => {
    return mappings.map(m => `${m.sign ?? "+"} COALESCE(($1->'${m.evakaType}'->>'amount') :: int, 0) * pg_temp.coefficient_multiplier($1->'${m.evakaType}'->>'coefficient')`).join("\n")
}

export const createSqlConditionalForCoefficients = (coeffMap: Record<string, string>) => {
    return Object.keys(coeffMap).map(c => `WHEN '${c}' THEN ${coeffMap[c]}`).join("\n")
}

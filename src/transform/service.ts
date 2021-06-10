
/**
 * Person target
id  -- autogen
social_security_number
first_name
last_name
email
language -- 2 char
date_of_birth
created
updated
customer_id -- autogen
street_address
postal_code
post_office
nationalities -- ignore
restricted_details_enabled
restricted_details_end_date -- ignore
phone
 */

import pgPromise from "pg-promise"
import { config } from "../config"
import migrationDb from "../db/db"
import { targetTableMapping } from "../mapping"
import { ColumnDescriptor, TableDescriptor, TableTyping } from "../types"

export const createTargetTable = async (table: TableDescriptor, t: pgPromise.ITask<{}>) => {
    const sql: string = `CREATE TABLE IF NOT EXISTS 
        ${config.migrationSchema ? config.migrationSchema + "." : ""}
        ${table.tableName} 
        (${table.columns.map(c => `${c.columnName} ${c.sqlType}`).join(",")});`
    await t.none(sql)
}

const buildTargetTableDescription = (tableName: string): TableDescriptor => {
    const columns: TableTyping = targetTableMapping[tableName]
    if (columns == null) {
        throw new Error("No such target table mapped");
    }
    const columnDescs: ColumnDescriptor[] = Object.keys(columns)
        .map(column => {
            return { columnName: column, sqlType: columns[column] }
        })
    return { tableName: tableName, columns: columnDescs }
}

export const insertEvakaPersons = async () => {
    return await migrationDb.tx(async (t) => {
        await createTargetTable(
            buildTargetTableDescription("evaka_person"),
            t)

        //TODO: Select and insert stuff here
    })
}
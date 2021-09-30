import migrationDb from "../db/db"
import { getMigrationSchemaPrefix, getMigrationUser, runQuery, wrapWithReturning } from "../util/queryTools"


//evaka tables are in the public schema
export const transferIncomeData = async (returnAll: boolean = false) => {
    const migrationUser = await getMigrationUser()
    const insertQueryPart = `
    INSERT INTO income (id, person_id, data, effect, valid_from, valid_to, updated_at, updated_by, notes, is_entrepreneur, application_id)
        SELECT
            id,
            person_id,
            data,
            effect::income_effect,
            valid_from,
            valid_to,
            current_timestamp(2) as updated_at,
            '${migrationUser.id}'::uuid as updated_by,
            notes,
            is_entrepreneur,
            application_id
        FROM ${getMigrationSchemaPrefix()}evaka_income p
    `
    const insertQuery = wrapWithReturning("income", insertQueryPart, returnAll)

    return await migrationDb.tx(async (t) => {
        return await runQuery(insertQuery, t, true)
    })

}
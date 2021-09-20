import migrationDb from "../db/db"
import { getMigrationSchemaPrefix, runQuery, wrapWithReturning } from "../util/queryTools"

export const transferDepartmentData = async (returnAll: boolean = false) => {
    const insertQueryPart = `
    INSERT INTO daycare_group
        (id, daycare_id, name, start_date, end_date)
    SELECT
        id, daycare_id, name, start_date, end_date
    FROM ${getMigrationSchemaPrefix()}evaka_daycare_group
    `
    const insertQuery = wrapWithReturning("daycare_group", insertQueryPart, returnAll)

    return await migrationDb.tx(async (t) => {
        return await runQuery(insertQuery, t, true)
    })

}

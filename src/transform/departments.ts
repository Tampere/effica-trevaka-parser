import migrationDb from "../db/db"
import { getExtensionSchema, getMigrationSchema, runQuery, wrapWithReturning } from "../util/queryTools"

export const transformDepartmentData = async (returnAll: boolean = false) => {
    const departmentTableQuery =
        `
        DROP TABLE IF EXISTS ${getMigrationSchema()}evaka_daycare_group CASCADE;
        CREATE TABLE ${getMigrationSchema()}evaka_daycare_group (
            id UUID NOT NULL DEFAULT ${getExtensionSchema()}uuid_generate_v1mc(),
            daycare_id UUID NOT NULL,
            effica_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            start_date date NOT NULL,
            end_date date NOT NULL
        );
        `

    const departmentQueryPart =
        `
        INSERT INTO ${getMigrationSchema()}evaka_daycare_group (daycare_id, effica_id, name, start_date, end_date)
        SELECT
            um.evaka_id as daycare_id,
            d.departmentcode as effica_id,
            d.departmentname as name,
            d.startdate as start_date,
            d.enddate as end_date
        FROM ${getMigrationSchema()}departments d
            JOIN ${getMigrationSchema()}unitmap um
                ON d.unitcode = um.effica_id
        `

    const departmentQuery = wrapWithReturning("evaka_daycare_group", departmentQueryPart, returnAll, ["effica_id"])

    return await migrationDb.tx(async (t) => {
        await runQuery(departmentTableQuery, t)
        return await runQuery(departmentQuery, t, true)
    })

}
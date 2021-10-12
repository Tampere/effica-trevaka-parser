// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "../db/db"
import { getExtensionSchemaPrefix, getMigrationSchemaPrefix, runQuery, wrapWithReturning } from "../util/queryTools"

export const transformDepartmentData = async (returnAll: boolean = false) => {
    const departmentTableQuery =
        `
        DROP TABLE IF EXISTS ${getMigrationSchemaPrefix()}evaka_daycare_group CASCADE;
        CREATE TABLE ${getMigrationSchemaPrefix()}evaka_daycare_group (
            id UUID NOT NULL DEFAULT ${getExtensionSchemaPrefix()}uuid_generate_v1mc(),
            daycare_id UUID NOT NULL
                CONSTRAINT daycare_group_daycare_id_fkey
			        REFERENCES ${getMigrationSchemaPrefix()}evaka_daycare
				        ON DELETE CASCADE,
            effica_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            start_date date NOT NULL,
            end_date date,
            CONSTRAINT start_before_end
		        CHECK (start_date <= end_date)
        );
        `

    const departmentQueryPart =
        `
        INSERT INTO ${getMigrationSchemaPrefix()}evaka_daycare_group (daycare_id, effica_id, name, start_date, end_date)
        SELECT
            um.evaka_id as daycare_id,
            d.departmentcode as effica_id,
            d.departmentname as name,
            d.startdate as start_date,
            d.enddate as end_date
        FROM ${getMigrationSchemaPrefix()}departments d
            JOIN ${getMigrationSchemaPrefix()}unitmap um
                ON d.unitcode = um.effica_id
        `

    const departmentQuery = wrapWithReturning("evaka_daycare_group", departmentQueryPart, returnAll, ["effica_id"])

    return await migrationDb.tx(async (t) => {
        await runQuery(departmentTableQuery, t)
        return await runQuery(departmentQuery, t, true)
    })

}
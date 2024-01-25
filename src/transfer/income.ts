// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "../db/db"
import { ensureEfficaUser } from "../db/evaka"
import { getMigrationSchemaPrefix, runQuery, wrapWithReturning } from "../util/queryTools"


//evaka tables are in the public schema
export const transferIncomeData = async (returnAll: boolean = false) => {
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
            $(updatedBy) as updated_by,
            notes,
            is_entrepreneur,
            application_id
        FROM ${getMigrationSchemaPrefix()}evaka_income p
    `
    const insertQuery = wrapWithReturning("income", insertQueryPart, returnAll, ["valid_from", "valid_to NULLS FIRST"])

    return await migrationDb.tx(async (t) => {
        const updatedBy = await ensureEfficaUser(t)
        return await runQuery(insertQuery, t, true, { updatedBy })
    })

}
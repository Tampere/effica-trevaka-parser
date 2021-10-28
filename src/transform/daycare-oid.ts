// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "../db/db"
import { runQuery, wrapWithReturning } from "../util/queryTools"

export const transformDaycareOidData = async (returnAll: boolean = false) => {

    const updateQueryPart = `
    UPDATE migration.evaka_daycare ed
    SET oph_unit_oid = (
        SELECT distinct oid
        FROM migration.daycare_oid_map dom
            JOIN migration.unitmap u ON u.effica_id = dom.effica_id
        WHERE u.evaka_id = ed.id)
    `
    const updateQuery = wrapWithReturning("daycare_oid_update", updateQueryPart, returnAll)

    return await migrationDb.tx(async (t) => {
        return await runQuery(updateQuery, t, true)
    })
}
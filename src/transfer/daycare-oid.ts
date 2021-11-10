// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "../db/db"
import { getMigrationSchemaPrefix, runQuery, wrapWithReturning } from "../util/queryTools"

export const transferDaycareOidData = async (returnAll: boolean = false) => {

    const updateDaycareQueryPart = `
    UPDATE daycare ed
    SET oph_unit_oid      = map.unit_oid,
        oph_organizer_oid = map.organizer_oid
    FROM (SELECT dom.evaka_id, dom.organizer_oid, dom.unit_oid
        FROM migration.daycare_oid_map dom
            JOIN daycare d ON d.id = dom.evaka_id) map
    WHERE ed.id = map.evaka_id
    `

    //TODO: what actually is the correct uploaded_at, as that is used to decide whether unit info in varda is up to date
    //do we force unit updates or try to "sync" up with Effica updates
    const insertVardaUnitQueryPart = `
    INSERT INTO varda_unit (evaka_daycare_id, varda_unit_id, uploaded_at)
    SELECT 
        dom.evaka_id,
        dom.varda_unit_id,
        now() - interval '20 years' --forces the update
    FROM ${getMigrationSchemaPrefix()}daycare_oid_map dom
    WHERE dom.varda_unit_id IS NOT NULL
    `
    const updateDaycareQuery = wrapWithReturning("daycare_oid_update", updateDaycareQueryPart, returnAll)
    const insertVardaUnitQuery = wrapWithReturning("daycare_varda_id_insert", insertVardaUnitQueryPart, returnAll)

    return await migrationDb.tx(async (t) => {
        const updateRes = await runQuery(updateDaycareQuery, t, true)
        const insertRes = await runQuery(insertVardaUnitQuery, t, true)
        return { daycare: updateRes, varda_unit: insertRes }
    })
}
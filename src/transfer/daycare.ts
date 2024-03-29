// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "../db/db"
import { getMigrationSchemaPrefix, runQuery, wrapWithReturning } from "../util/queryTools"

export const transferDaycareData = async (returnAll: boolean = false) => {
    const insertQueryPart = `
    INSERT INTO daycare
        (id, name, type, care_area_id, phone, url, backup_location, language_emphasis_id, opening_date, closing_date,
            email, schedule, additional_info, cost_center, upload_to_varda, capacity,
            decision_daycare_name, decision_preschool_name, decision_handler, decision_handler_address,
            street_address, postal_code, post_office, mailing_po_box, location,
            mailing_street_address, mailing_postal_code, mailing_post_office,
            invoiced_by_municipality, provider_type, language, upload_to_koski,
            oph_unit_oid, oph_organizer_oid,
            ghost_unit,
            daycare_apply_period, preschool_apply_period, club_apply_period,
            finance_decision_handler, round_the_clock, enabled_pilot_features, upload_children_to_varda)
    SELECT
        id, name, type::care_types[],
        care_area_id,
        phone, url, backup_location,
        null, -- language_emphasis_id, no data available
        opening_date, closing_date,
        email, schedule, additional_info,
        cost_center, upload_to_varda,
        capacity,
        decision_daycare_name, decision_preschool_name,
        decision_handler,
        decision_handler_address,
        street_address, postal_code, post_office, mailing_po_box, location,
        mailing_street_address, mailing_postal_code, mailing_post_office,
        invoiced_by_municipality, provider_type::unit_provider_type, language::unit_language, upload_to_koski,
        oph_unit_oid,
        oph_organizer_oid,
        ghost_unit,
        daycare_apply_period, preschool_apply_period, club_apply_period,
        null, -- finance_decision_handler, no data available
        round_the_clock,
        enabled_pilot_features,
        upload_children_to_varda
    FROM ${getMigrationSchemaPrefix()}evaka_daycare
    `
    const insertQuery = wrapWithReturning("daycare", insertQueryPart, returnAll)

    return await migrationDb.tx(async (t) => {
        return await runQuery(insertQuery, t, true)
    })

}

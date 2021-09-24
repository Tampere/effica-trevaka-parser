import migrationDb from "../db/db"
import { getMigrationSchemaPrefix, runQuery, wrapWithReturning } from "../util/queryTools"

export const transferDaycareData = async (returnAll: boolean = false) => {
    const insertQueryPart = `
    INSERT INTO daycare
        (id, name, type, care_area_id, phone, url, backup_location, language_emphasis_id, opening_date, closing_date,
            email, schedule, additional_info, unit_manager_id, cost_center, upload_to_varda, capacity,
            decision_daycare_name, decision_preschool_name, decision_handler, decision_handler_address,
            street_address, postal_code, post_office, mailing_po_box, location,
            mailing_street_address, mailing_postal_code, mailing_post_office,
            invoiced_by_municipality, provider_type, language, upload_to_koski,
            oph_organization_oid, oph_unit_oid, oph_organizer_oid,
            operation_days, ghost_unit,
            daycare_apply_period, preschool_apply_period, club_apply_period,
            finance_decision_handler, round_the_clock, enabled_pilot_features, upload_children_to_varda)
    SELECT
        id, name, type::care_types[],
        CASE care_area_id::text
            WHEN '6529e31e-9777-11eb-ba88-33a923255570' THEN (SELECT id FROM care_area WHERE short_name = 'etela')
            WHEN '6529f5a2-9777-11eb-ba89-cfcda122ed3b' THEN (SELECT id FROM care_area WHERE short_name = 'ita')
            WHEN '6529f6ce-9777-11eb-ba8a-8f6495ec5104' THEN (SELECT id FROM care_area WHERE short_name = 'lansi')
        END, -- TODO: CareAreaMap
        phone, url, backup_location,
        null, -- TODO: language_emphasis_id
        opening_date, closing_date,
        email, schedule, additional_info,
        unit_manager_id,
        cost_center, upload_to_varda,
        0, -- TODO: capacity
        decision_daycare_name, decision_preschool_name,
        '', -- TODO: decision_handler
        '', -- TODO: decision_handler_address
        street_address, postal_code, post_office, mailing_po_box, location,
        mailing_street_address, mailing_postal_code, mailing_post_office,
        invoiced_by_municipality, provider_type::unit_provider_type, language::unit_language, upload_to_koski,
        null, -- TODO: oph_organization_oid
        null, -- TODO: oph_unit_oid
        null, -- TODO: oph_organizer_oid
        operation_days, ghost_unit,
        daycare_apply_period, preschool_apply_period, club_apply_period,
        null, -- TODO: finance_decision_handler
        round_the_clock, '{}',
        false -- TODO: upload_children_to_varda
    FROM ${getMigrationSchemaPrefix()}evaka_daycare
    `
    const insertQuery = wrapWithReturning("daycare", insertQueryPart, returnAll)

    return await migrationDb.tx(async (t) => {
        return await runQuery(insertQuery, t, true)
    })

}

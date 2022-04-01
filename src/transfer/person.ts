// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { config } from "../config"
import migrationDb from "../db/db"
import { getMigrationSchemaPrefix, runQuery, wrapWithReturning } from "../util/queryTools"

//FIXME: updated_from_vtj is required for all rows with a non-null ssn in eVaka
//evaka tables are in the public schema
export const transferPersonData = async (returnAll: boolean = false) => {
    const insertQueryPart = `
    INSERT INTO person 
    (id, social_security_number, last_name, first_name, email, language, street_address, postal_code, post_office, restricted_details_enabled, phone, backup_phone, date_of_birth, updated_from_vtj, vtj_guardians_queried, vtj_dependants_queried)
        SELECT
            id,
            p.social_security_number,
            last_name,
            first_name,
            email,
            language,
            street_address,
            postal_code,
            post_office,
            restricted_details_enabled,
            phone,
            backup_phone,
            date_of_birth,
            '2021-05-01'::timestamptz as updated_from_vtj,
            ${config.mockVtj ? `'2021-05-01'::timestamptz` : 'null'},
            ${config.mockVtj ? `'2021-05-01'::timestamptz` : 'null'}
        FROM ${getMigrationSchemaPrefix()}evaka_person p
        ON CONFLICT (social_security_number) DO NOTHING
    `
    const insertQuery = wrapWithReturning("person", insertQueryPart, returnAll)

    // from V84__create_message_accounts.sql
    const messageAccountQuery = `
    INSERT INTO message_account (person_id)
    SELECT id
    FROM person
    ON CONFLICT DO NOTHING
    RETURNING *;
    `;

    return await migrationDb.tx(async (t) => {
        const persons = await runQuery(insertQuery, t, true)
        const messageAccounts = await runQuery(messageAccountQuery, t, true);
        return { persons, messageAccounts };
    })

}
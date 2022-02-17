// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { config } from "../config"
import migrationDb from "../db/db"
import { getExtensionSchemaPrefix, getMigrationSchemaPrefix, runQuery, wrapWithReturning } from "../util/queryTools"

//FIXME: updated_from_vtj is required for all rows with a non-null ssn in eVaka
export const transformPersonData = async (returnAll: boolean = false) => {
    const tableQuery = `
    DROP TABLE IF EXISTS ${getMigrationSchemaPrefix()}evaka_person CASCADE;
    CREATE TABLE ${getMigrationSchemaPrefix()}evaka_person(
        id UUID NOT NULL,
        effica_guid TEXT,
        social_security_number TEXT UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT,
        language TEXT,
        date_of_birth DATE NOT NULL,
        street_address TEXT,
        postal_code TEXT,
        post_office TEXT,
        nationalities varchar(3)[] NOT NULL,
        restricted_details_enabled BOOLEAN,
        phone TEXT NOT NULL,
        backup_phone text NOT NULL,
        effica_ssn TEXT,
        source_system TEXT NOT NULL CHECK (source_system IN ('effica', 'evaka')),
        PRIMARY KEY(id)
    );`

    const evakaPersonInsert = `
    INSERT INTO ${getMigrationSchemaPrefix()}evaka_person
        (id, effica_guid, social_security_number, last_name, first_name, email, language, street_address, postal_code, post_office, nationalities, restricted_details_enabled, phone, backup_phone, effica_ssn, date_of_birth, source_system)
    SELECT
        id, 'evaka-' || id, social_security_number, last_name, first_name, email, language, street_address, postal_code, post_office, nationalities, restricted_details_enabled, phone, backup_phone, social_security_number, date_of_birth, 'evaka'
    FROM person
    `

    const insertQueryPart = `
    INSERT INTO ${getMigrationSchemaPrefix()}evaka_person 
    (id, effica_guid, social_security_number, last_name, first_name, email, language, street_address, postal_code, post_office, nationalities, restricted_details_enabled, phone, backup_phone, effica_ssn, date_of_birth, source_system)
        SELECT
        ${getExtensionSchemaPrefix()}uuid_generate_v1mc(),
        p.guid,
        CASE WHEN p.personid ILIKE '%TP%' THEN NULL ELSE personid END AS social_security_number,
        COALESCE(trim(split_part(p.personname, ',', 1)), '') AS last_name,
        COALESCE(trim(split_part(p.personname, ',', 2)), '') AS first_name,
        p.personhomeemail,
        c.extrainfo1 AS language,
        CASE WHEN p.secretaddress IS TRUE THEN '' ELSE coalesce(p.personstreetaddress, '') END AS street_address,
        CASE WHEN p.secretaddress IS TRUE THEN '' ELSE coalesce(p.personzipcode, '') END AS postal_code,
        CASE WHEN p.secretaddress IS TRUE THEN '' ELSE coalesce(p.personcity, '') END AS post_office,
        '{}', -- TODO: nationality
        p.secretaddress AS restricted_details_enabled,
        (CASE
            WHEN (length(p.personmobilephone) <= 20 AND length(p.personmobilephone) > 0) THEN p.personmobilephone
            ELSE
                CASE
                    WHEN (length(p.phonework) <= 20 AND length(p.phonework) > 0) THEN p.phonework
                    WHEN (length(p.phonehome) <= 20 AND length(p.phonehome) > 0) THEN p.phonehome
                    ELSE ''
                END
        END) AS phone,
        (CASE
            WHEN (length(p.personmobilephone) <= 20 AND length(p.personmobilephone) > 0) THEN
                CASE
                    WHEN (length(p.phonework) <= 20 AND length(p.phonework) > 0) THEN p.phonework
                    WHEN (length(p.phonehome) <= 20 AND length(p.phonehome) > 0) THEN p.phonehome
                    ELSE ''
                END
            WHEN (length(p.phonework) <= 20 AND length(p.phonework) > 0) THEN
                CASE
                    WHEN (length(p.phonehome) <= 20 AND length(p.phonehome) > 0) THEN p.phonehome
                    ELSE ''
                END
            ELSE ''
        END) AS backup_phone,
        p.personid AS effica_ssn,
        concat(CASE substr(personid, 7, 1)
                        WHEN '-' THEN 1900
                        WHEN '+' THEN 1800
                        WHEN 'A' THEN 2000 END
                        + substr(personid, 5, 2)::smallint, '-', substr(personid, 3, 2), '-',
                    substr(personid, 1, 2))::date AS date_of_birth,
        'effica'
        FROM ${getMigrationSchemaPrefix()}persons p
        LEFT JOIN ${getMigrationSchemaPrefix()}codes c
        ON p.mothertongue = c.code AND c.codetype = 'SPRAK'
        ON CONFLICT (social_security_number) DO NOTHING
    `

    const insertQuery = wrapWithReturning("evaka_person", insertQueryPart, returnAll)

    return await migrationDb.tx(async (t) => {
        await runQuery(tableQuery, t)
        if (config.copyPersonsFromEvaka) {
            await runQuery(evakaPersonInsert, t)
        }
        return await runQuery(insertQuery, t, true)
    })

}
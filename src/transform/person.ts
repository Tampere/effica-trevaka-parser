import migrationDb from "../db/db"
import { getExtensionSchema, getMigrationSchema, runQuery, wrapWithReturning } from "../util/queryTools"

export const transformPersonData = async (returnAll: boolean = false) => {
    const tableQuery = `
    DROP TABLE IF EXISTS ${getMigrationSchema()}evaka_person CASCADE;
    CREATE TABLE ${getMigrationSchema()}evaka_person(
        id UUID NOT NULL DEFAULT ${getExtensionSchema()}uuid_generate_v1mc(),
        social_security_number TEXT,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        language TEXT[],
        date_of_birth DATE,
        street_address TEXT,
        postal_code TEXT,
        post_office TEXT,
        restricted_details_enabled BOOLEAN,
        phone TEXT,
        effica_ssn TEXT,
        PRIMARY KEY(id)
    );`

    const insertQueryPart = `
    INSERT INTO ${getMigrationSchema()}evaka_person 
    (social_security_number, last_name, first_name, email, language, street_address, postal_code, post_office, restricted_details_enabled, phone, effica_ssn, date_of_birth)
        SELECT
        CASE WHEN p.personid ILIKE '%TP%' THEN NULL ELSE personid END AS social_security_number,
        trim(split_part(p.personname, ',', 1)) AS last_name,
        trim(split_part(p.personname, ',', 2)) AS first_name,
        p.personhomeemail,
        CASE WHEN c.extrainfo1 IS NULL THEN '{}' ELSE ARRAY[c.extrainfo1] END AS language,
        CASE WHEN p.secretaddress IS TRUE THEN '' ELSE coalesce(p.personstreetaddress, '') END AS street_address,
        CASE WHEN p.secretaddress IS TRUE THEN '' ELSE coalesce(p.personzipcode, '') END AS postal_code,
        CASE WHEN p.secretaddress IS TRUE THEN '' ELSE coalesce(p.personcity, '') END AS post_office,
        p.secretaddress AS restricted_details_enabled,
        (CASE WHEN length(p.personmobilephone) > 20 THEN NULL ELSE p.personmobilephone END) AS phone,
        p.personid AS effica_ssn,
        concat(CASE substr(personid, 7, 1)
                        WHEN '-' THEN 1900
                        WHEN '+' THEN 1800
                        WHEN 'A' THEN 2000 END
                        + substr(personid, 5, 2)::smallint, '-', substr(personid, 3, 2), '-',
                    substr(personid, 1, 2))::date AS date_of_birth
        FROM ${getMigrationSchema()}person p
        LEFT JOIN ${getMigrationSchema()}codes c
        ON p.mothertongue = c.code AND c.codetype = 'SPRAK'`

    const insertQuery = wrapWithReturning("evaka_person", insertQueryPart, returnAll)

    return await migrationDb.tx(async (t) => {
        await runQuery(tableQuery, t)
        return await runQuery(insertQuery, t, true)
    })

}
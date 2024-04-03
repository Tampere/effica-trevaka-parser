-- SPDX-FileCopyrightText: 2023-2024 Tampere region
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP TABLE IF EXISTS $(migrationSchema:name).evaka_async_job_vtj_refresh;
DROP TABLE IF EXISTS $(migrationSchema:name).evaka_person;

CREATE TABLE $(migrationSchema:name).evaka_person
(
    id                         UUID PRIMARY KEY,
    social_security_number     TEXT UNIQUE,
    first_name                 TEXT NOT NULL,
    last_name                  TEXT NOT NULL,
    email                      TEXT,
    language                   TEXT,
    date_of_birth              DATE NOT NULL,
    street_address             TEXT,
    postal_code                TEXT,
    post_office                TEXT,
    restricted_details_enabled BOOLEAN,
    phone                      TEXT NOT NULL,
    backup_phone               TEXT NOT NULL,
    updated_from_vtj           TIMESTAMP WITH TIME ZONE,
    vtj_guardians_queried      TIMESTAMP WITH TIME ZONE,
    vtj_dependants_queried     TIMESTAMP WITH TIME ZONE,
    effica_ssn                 TEXT NOT NULL UNIQUE,
    source_system              TEXT NOT NULL CHECK (source_system IN ('effica', 'evaka')),
    CHECK (social_security_number IS NULL OR updated_from_vtj IS NOT NULL)
);

CREATE TABLE $(migrationSchema:name).evaka_async_job_vtj_refresh
(
    type           TEXT     NOT NULL,
    retry_count    INTEGER  NOT NULL,
    retry_interval INTERVAL NOT NULL,
    payload        JSONB    NOT NULL
);

INSERT INTO $(migrationSchema:name).evaka_person (id, social_security_number, first_name, last_name, email, language,
                                                  date_of_birth, street_address, postal_code, post_office,
                                                  restricted_details_enabled, phone, backup_phone, updated_from_vtj,
                                                  vtj_guardians_queried, vtj_dependants_queried, effica_ssn,
                                                  source_system)
SELECT id,
       social_security_number,
       first_name,
       last_name,
       email,
       language,
       date_of_birth,
       street_address,
       postal_code,
       post_office,
       restricted_details_enabled,
       phone,
       backup_phone,
       updated_from_vtj,
       vtj_guardians_queried,
       vtj_dependants_queried,
       social_security_number,
       'evaka'
FROM person
WHERE social_security_number IS NOT NULL;

INSERT INTO $(migrationSchema:name).evaka_person (id, social_security_number, first_name, last_name, email, language,
                                                  date_of_birth, street_address, postal_code, post_office,
                                                  restricted_details_enabled, phone, backup_phone, updated_from_vtj,
                                                  vtj_guardians_queried, vtj_dependants_queried, effica_ssn,
                                                  source_system)
SELECT $(extensionSchema:name).uuid_generate_v1mc(),
       CASE WHEN effica_person.personnr ILIKE '%TP%' THEN NULL ELSE effica_person.personnr END,
       coalesce(trim(split_part(effica_person.namn, ',', 2)), ''),
       coalesce(trim(split_part(effica_person.namn, ',', 1)), ''),
       coalesce(effica_person.eposthem, effica_person.epostarb),
       effica_person.modersmal,
       $(migrationSchema:name).parse_ssn_birth_date(effica_person.personnr),
       CASE WHEN effica_person.adrskydd = 'X' THEN '' ELSE coalesce(effica_person.adress, '') END,
       CASE WHEN effica_person.adrskydd = 'X' THEN '' ELSE coalesce(effica_person.reglpostnr, '') END,
       CASE WHEN effica_person.adrskydd = 'X' THEN '' ELSE coalesce(effica_person.reglort, '') END,
       effica_person.adrskydd = 'X',
       coalesce(effica_person.reglhemtel, ''),
       coalesce(effica_person.reglarbtel, ''),
       CASE WHEN effica_person.personnr ILIKE '%TP%' THEN NULL ELSE '2021-05-01'::timestamptz END,
       $(vtjQueried),
       $(vtjQueried),
       effica_person.personnr,
       'effica'
FROM $(migrationSchema:name).effica_person
ON CONFLICT (social_security_number) DO NOTHING;

INSERT INTO $(migrationSchema:name).evaka_async_job_vtj_refresh (type, retry_count, retry_interval, payload)
SELECT 'VTJRefresh', 1, interval '5 minutes', jsonb_build_object('user', null, 'personId', id)
FROM $(migrationSchema:name).evaka_person
WHERE social_security_number IS NOT NULL
  AND updated_from_vtj < '2024-01-01'
  AND source_system = 'effica';

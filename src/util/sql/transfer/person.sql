-- SPDX-FileCopyrightText: 2023-2024 Tampere region
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

INSERT INTO person (id, social_security_number, first_name, last_name, email, language, date_of_birth, street_address,
                    postal_code, post_office, restricted_details_enabled, phone, backup_phone, updated_from_vtj,
                    vtj_guardians_queried, vtj_dependants_queried)
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
       vtj_dependants_queried
FROM $(migrationSchema:name).evaka_person p
ON CONFLICT (social_security_number) DO NOTHING;

INSERT INTO message_account (person_id, type)
SELECT id, 'CITIZEN'
FROM person
ON CONFLICT DO NOTHING;

INSERT INTO async_job (type, retry_count, retry_interval, payload)
SELECT type, retry_count, retry_interval, payload
FROM $(migrationSchema:name).evaka_async_job_vtj_refresh;

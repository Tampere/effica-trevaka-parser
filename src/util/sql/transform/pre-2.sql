-- SPDX-FileCopyrightText: 2023-2024 Tampere region
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP TABLE IF EXISTS $(migrationSchema:name).evaka_async_job_update_from_vtj_2;

CREATE TABLE $(migrationSchema:name).evaka_async_job_update_from_vtj_2
(
    type           TEXT     NOT NULL,
    retry_count    INTEGER  NOT NULL,
    retry_interval INTERVAL NOT NULL,
    payload        JSONB    NOT NULL
);

WITH all_ssn_excluding_head_of_child AS (SELECT DISTINCT personnr AS ssn
                                         FROM $(migrationSchema:name).effica_person
                                         UNION
                                         SELECT DISTINCT personnr AS ssn
                                         FROM $(migrationSchema:name).effica_fridge_child
                                         UNION
                                         SELECT DISTINCT barnpnr
                                         FROM $(migrationSchema:name).effica_placement
                                         UNION
                                         SELECT DISTINCT reglpnr AS ssn
                                         FROM $(migrationSchema:name).effica_income
                                         UNION
                                         SELECT DISTINCT samhorpnr AS ssn
                                         FROM $(migrationSchema:name).effica_income)
INSERT
INTO $(migrationSchema:name).evaka_async_job_update_from_vtj_2 (type, retry_count, retry_interval, payload)
SELECT 'UpdateFromVtj', 1, interval '5 minutes', jsonb_build_object('user', null, 'ssn', ssn)
FROM all_ssn_excluding_head_of_child
WHERE ssn NOT ILIKE '%TP%'
  AND ssn NOT IN (SELECT payload ->> 'ssn' FROM $(migrationSchema:name).evaka_async_job_update_from_vtj_1);

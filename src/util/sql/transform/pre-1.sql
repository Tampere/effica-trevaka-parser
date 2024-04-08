-- SPDX-FileCopyrightText: 2023-2024 Tampere region
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP TABLE IF EXISTS $(migrationSchema:name).evaka_async_job_update_from_vtj_1;

CREATE TABLE $(migrationSchema:name).evaka_async_job_update_from_vtj_1
(
    type           TEXT     NOT NULL,
    retry_count    INTEGER  NOT NULL,
    retry_interval INTERVAL NOT NULL,
    payload        JSONB    NOT NULL
);

WITH all_head_of_child_ssn AS (SELECT DISTINCT regledare AS ssn
                               FROM $(migrationSchema:name).effica_fridge_child)
INSERT
INTO $(migrationSchema:name).evaka_async_job_update_from_vtj_1 (type, retry_count, retry_interval, payload)
SELECT 'UpdateFromVtj', 1, interval '5 minutes', jsonb_build_object('user', null, 'ssn', ssn)
FROM all_head_of_child_ssn
WHERE ssn NOT ILIKE '%TP%';

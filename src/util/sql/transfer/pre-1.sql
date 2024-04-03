-- SPDX-FileCopyrightText: 2023-2024 Tampere region
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

INSERT INTO async_job (type, retry_count, retry_interval, payload)
SELECT type, retry_count, retry_interval, payload
FROM $(migrationSchema:name).evaka_async_job_update_from_vtj_1;

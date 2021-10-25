-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

INSERT INTO child (id)
SELECT DISTINCT child_id
FROM ${migrationSchema:name}.evaka_backup_care
ON CONFLICT (id) DO NOTHING;

INSERT INTO backup_care (id, child_id, unit_id, group_id, start_date, end_date)
SELECT id, child_id, unit_id, group_id, start_date, end_date
FROM ${migrationSchema:name}.evaka_backup_care;

-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

INSERT INTO child (id)
SELECT DISTINCT child_id
FROM ${migrationSchema:name}.evaka_child_attendance
ON CONFLICT (id) DO NOTHING;

INSERT INTO child_attendance
    (id, child_id, arrived, departed, unit_id)
SELECT
    id, child_id, arrived, departed, unit_id
FROM ${migrationSchema:name}.evaka_child_attendance;

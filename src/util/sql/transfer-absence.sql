-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

INSERT INTO child (id)
SELECT DISTINCT child_id
FROM ${migrationSchema:name}.evaka_absence
ON CONFLICT (id) DO NOTHING;

INSERT INTO absence (id, child_id, date, category, absence_type, modified_at, modified_by)
SELECT id, child_id, date, category::absence_category, absence_type::absence_type, now(), $(modifiedBy)
FROM ${migrationSchema:name}.evaka_absence;

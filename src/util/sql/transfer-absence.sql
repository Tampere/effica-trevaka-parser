-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

INSERT INTO child (id)
SELECT DISTINCT child_id
FROM ${migrationSchema:name}.evaka_absence
ON CONFLICT (id) DO NOTHING;

INSERT INTO absence (id, child_id, date, care_type, absence_type, modified_by)
SELECT id, child_id, date, care_type, absence_type, $(modifiedBy)
FROM ${migrationSchema:name}.evaka_absence;

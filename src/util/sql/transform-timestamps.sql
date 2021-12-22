-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

CREATE OR REPLACE VIEW ${migrationSchema:name}.timestamps_view AS
WITH details AS (
    SELECT
        rownumber,
        day,
        unnest(ARRAY[starttime1, starttime2, starttime3]) AS starttime,
        unnest(ARRAY[endtime1, endtime2, endtime3]) AS endtime
    FROM ${migrationSchema:name}.timestampdetails
)
SELECT
    h.rownumber,
    h.unit,
    h.childminder,
    h.personid,
    (h.period || lpad(d.day::text, 2, '0'))::date AS date,
    d.starttime::time,
    d.endtime::time
FROM details d
JOIN ${migrationSchema:name}.timestampheaders h ON h.rownumber = d.rownumber AND h.rowtype = 'R'
WHERE starttime IS NOT NULL OR endtime IS NOT NULL;

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_child_attendance;
CREATE TABLE ${migrationSchema:name}.evaka_child_attendance (
    id UUID PRIMARY KEY,
    effica_rownumber INTEGER NOT NULL,
    child_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    arrived TIMESTAMP WITH TIME ZONE,
    departed TIMESTAMP WITH TIME ZONE,
    unit_id UUID REFERENCES ${migrationSchema:name}.evaka_daycare
);

INSERT INTO ${migrationSchema:name}.evaka_child_attendance
    (id, effica_rownumber, child_id, arrived, departed, unit_id)
SELECT
    ${extensionSchema:name}.uuid_generate_v1mc(),
    t.rownumber,
    child.id,
    (t.date + t.starttime) AT TIME ZONE 'Europe/Helsinki',
    (t.date + t.endtime) AT TIME ZONE 'Europe/Helsinki',
    COALESCE(um.evaka_id, cm.evaka_id)
FROM ${migrationSchema:name}.timestamps_view t
LEFT JOIN ${migrationSchema:name}.evaka_person child ON child.effica_ssn = t.personid
LEFT JOIN ${migrationSchema:name}.unitmap um ON um.effica_id = t.unit
LEFT JOIN ${migrationSchema:name}.childmindermap cm ON cm.effica_id = t.childminder;

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_child_attendance_todo;
CREATE TABLE ${migrationSchema:name}.evaka_child_attendance_todo AS
SELECT *, 'TODO TABLE' AS reason
FROM ${migrationSchema:name}.evaka_child_attendance
WHERE 1 = 2;

INSERT INTO ${migrationSchema:name}.evaka_child_attendance_todo
SELECT *, 'PERSON MISSING'
FROM ${migrationSchema:name}.evaka_child_attendance
WHERE child_id IS NULL;

INSERT INTO ${migrationSchema:name}.evaka_child_attendance_todo
SELECT *, 'TIME MISSING'
FROM ${migrationSchema:name}.evaka_child_attendance
WHERE arrived IS NULL OR departed IS NULL;

INSERT INTO ${migrationSchema:name}.evaka_child_attendance_todo
SELECT *, 'UNIT MISSING'
FROM ${migrationSchema:name}.evaka_child_attendance
WHERE unit_id IS NULL;

DELETE FROM ${migrationSchema:name}.evaka_child_attendance
WHERE id IN (SELECT id FROM ${migrationSchema:name}.evaka_child_attendance_todo);

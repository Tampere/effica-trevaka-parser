-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

CREATE OR REPLACE VIEW ${migrationSchema:name}.timestamps_view AS
WITH details AS (
    SELECT
        rownumber,
        day,
        unnest(ARRAY[
            starttime1::time,
            starttime2::time,
            starttime3::time
        ]) AS starttime,
        unnest(ARRAY[
            CASE WHEN starttime1 IS NOT NULL THEN COALESCE(
                endtime1::time,
                starttime2::time - interval '1 minute',
                starttime3::time - interval '1 minute',
                '2359'::time
            ) END,
            CASE WHEN starttime2 IS NOT NULL THEN COALESCE(
                endtime2::time,
                starttime3::time - interval '1 minute',
                '2359'::time
            ) END,
            CASE WHEN starttime3 IS NOT NULL THEN COALESCE(
                endtime3::time,
                '2359'::time
            ) END
        ]) AS endtime
    FROM ${migrationSchema:name}.timestampdetails
)
SELECT
    h.rownumber,
    h.unit,
    h.childminder,
    h.personid,
    (h.period || lpad(d.day::text, 2, '0'))::date AS date,
    h.placementnumber,
    d.starttime,
    d.endtime
FROM details d
JOIN ${migrationSchema:name}.timestampheaders h ON h.rownumber = d.rownumber AND h.rowtype = 'R'
WHERE starttime IS NOT NULL OR endtime IS NOT NULL;

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_child_attendance;
CREATE TABLE ${migrationSchema:name}.evaka_child_attendance (
    id UUID PRIMARY KEY,
    effica_rownumber INTEGER NOT NULL,
    child_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    date DATE,
    start_time TIME WITHOUT TIME ZONE,
    end_time TIME WITHOUT TIME ZONE,
    unit_id UUID REFERENCES ${migrationSchema:name}.evaka_daycare,
    effica_unit_id INTEGER,
    effica_childminder_id TEXT,
    effica_placement_number INTEGER NOT NULL
);

INSERT INTO ${migrationSchema:name}.evaka_child_attendance
    (id, effica_rownumber, child_id, date, start_time, end_time, unit_id, effica_unit_id, effica_childminder_id, effica_placement_number)
SELECT
    ${extensionSchema:name}.uuid_generate_v1mc(),
    t.rownumber,
    child.id,
    t.date,
    t.starttime,
    t.endtime,
    COALESCE(um.evaka_id, cm.evaka_id),
    t.unit,
    t.childminder,
    t.placementnumber
FROM ${migrationSchema:name}.timestamps_view t
LEFT JOIN ${migrationSchema:name}.evaka_person child ON child.effica_ssn = t.personid
LEFT JOIN ${migrationSchema:name}.unitmap um ON um.effica_id = t.unit
LEFT JOIN ${migrationSchema:name}.childmindermap cm ON cm.effica_id = t.childminder
WHERE daterange($(selectionPeriodStartDate:csv)::date, $(selectionPeriodEndDate:csv)::date,'[]') @> t.date;

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
SELECT *, '0-DURATION'
FROM ${migrationSchema:name}.evaka_child_attendance
WHERE start_time = end_time;

INSERT INTO ${migrationSchema:name}.evaka_child_attendance_todo
SELECT *, 'TIME MISSING'
FROM ${migrationSchema:name}.evaka_child_attendance
WHERE date IS NULL OR start_time IS NULL OR end_time IS NULL;

INSERT INTO ${migrationSchema:name}.evaka_child_attendance_todo
SELECT *, 'UNIT MISSING'
FROM ${migrationSchema:name}.evaka_child_attendance
WHERE unit_id IS NULL;

INSERT INTO ${migrationSchema:name}.evaka_child_attendance_todo
SELECT *, 'ARRIVED AFTER DEPARTED'
FROM ${migrationSchema:name}.evaka_child_attendance
WHERE start_time > end_time;

INSERT INTO ${migrationSchema:name}.evaka_child_attendance_todo
SELECT *, 'OVERLAPPING ATTENDANCE WITH 0-PLACEMENT'
FROM ${migrationSchema:name}.evaka_child_attendance a
WHERE a.effica_placement_number = 0
AND EXISTS (
    SELECT 1
    FROM ${migrationSchema:name}.evaka_child_attendance b
    WHERE a.id <> b.id
    AND a.child_id = b.child_id
    AND a.date = b.date
    AND a.end_time >= a.start_time
    AND b.end_time >= b.start_time
    AND tsrange(a.date + a.start_time, a.date + a.end_time) && tsrange(b.date + b.start_time, b.date + b.end_time)
);

INSERT INTO ${migrationSchema:name}.evaka_child_attendance_todo
SELECT *, 'OVERLAPPING ATTENDANCE WITH PLACEMENT'
FROM ${migrationSchema:name}.evaka_child_attendance a
WHERE a.effica_placement_number <> 0
AND EXISTS (
    SELECT 1
    FROM ${migrationSchema:name}.evaka_child_attendance b
    WHERE a.id <> b.id
    AND b.effica_placement_number <> 0
    AND a.child_id = b.child_id
    AND a.date = b.date
    AND a.end_time >= a.start_time
    AND b.end_time >= b.start_time
    AND tsrange(a.date + a.start_time, a.date + a.end_time) && tsrange(b.date + b.start_time, b.date + b.end_time)
);

DELETE FROM ${migrationSchema:name}.evaka_child_attendance
WHERE id IN (SELECT id FROM ${migrationSchema:name}.evaka_child_attendance_todo);

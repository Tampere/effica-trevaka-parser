-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_placement CASCADE;
CREATE TABLE ${migrationSchema:name}.evaka_placement (
    -- placement
    id UUID PRIMARY KEY DEFAULT ${extensionSchema:name}.uuid_generate_v1mc(),
    effica_placement_nbr INTEGER NOT NULL,
    effica_ssn TEXT NOT NULL,
    type TEXT NOT NULL,
    child_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    unit_id UUID REFERENCES ${migrationSchema:name}.evaka_daycare,
    start_date DATE NOT NULL,
    end_date DATE,
    daycare_group_id UUID,
    effica_unit_id INTEGER,
    effica_department_id INTEGER,
    effica_childminder_id TEXT,
    child_date_of_birth DATE,
    -- service need
    effica_extent_nbr INTEGER,
    effica_extent_code TEXT,
    option_id UUID,
    UNIQUE (effica_placement_nbr, effica_extent_nbr)
);

INSERT INTO ${migrationSchema:name}.evaka_placement
    (effica_placement_nbr, effica_ssn, type, child_id, unit_id, start_date, end_date, daycare_group_id, effica_unit_id, effica_department_id, effica_childminder_id, child_date_of_birth,
     effica_extent_nbr, effica_extent_code, option_id)
SELECT
    p.placementnbr,
    p.personid,
    COALESCE(sno.valid_placement_type, 'DAYCARE'),
    ep.id,
    COALESCE(um.evaka_id, cm.evaka_id),
    pe.startdate,
    pe.enddate,
    edg.id,
    p.placementunitcode,
    p.placementdepartmentcode,
    p.placementchildminder,
    ep.date_of_birth,
    pe.extentnbr,
    pe.extentcode,
    em.evaka_id
FROM ${migrationSchema:name}.filtered_placements_v p
LEFT JOIN ${migrationSchema:name}.evaka_person ep ON ep.effica_ssn = p.personid
LEFT JOIN ${migrationSchema:name}.unitmap um ON um.effica_id = p.placementunitcode
LEFT JOIN ${migrationSchema:name}.evaka_daycare_group edg ON edg.effica_id = p.placementdepartmentcode
LEFT JOIN ${migrationSchema:name}.childmindermap cm ON cm.effica_id = p.placementchildminder
LEFT JOIN ${migrationSchema:name}.placementextents pe ON pe.placementnbr = p.placementnbr
LEFT JOIN ${migrationSchema:name}.extentmap em ON em.effica_id = pe.extentcode AND em.days = pe.days
LEFT JOIN service_need_option sno ON sno.id = em.evaka_id;

-- delete duplicate rows
DELETE FROM ${migrationSchema:name}.evaka_placement p1
USING ${migrationSchema:name}.evaka_placement p2
WHERE p1.effica_placement_nbr = p2.effica_placement_nbr
AND p1.effica_extent_nbr > p2.effica_extent_nbr
AND p1.start_date = p2.start_date
AND (p1.end_date = p2.end_date OR p1.end_date IS NULL AND p2.end_date IS NULL)
AND p1.effica_extent_code = p2.effica_extent_code;

-- fix null end dates from next start dates
WITH
data1 AS (
    SELECT *
    FROM ${migrationSchema:name}.evaka_placement
    WHERE end_date IS NULL
),
data2 AS (
    SELECT data1.id, MIN(data2.start_date) - INTERVAL '1 day' AS new_end_date
    FROM data1, ${migrationSchema:name}.evaka_placement data2
    WHERE data1.effica_ssn = data2.effica_ssn
    AND data1.id <> data2.id
    AND data2.start_date > data1.start_date
    GROUP BY data1.id
)
UPDATE ${migrationSchema:name}.evaka_placement
SET end_date = data2.new_end_date
FROM data2
WHERE ${migrationSchema:name}.evaka_placement.id = data2.id;

-- fix null end dates based on placement type
UPDATE ${migrationSchema:name}.evaka_placement
SET end_date = (
    CASE
        WHEN effica_unit_id IN ($(erhoUnits:csv))
            THEN child_date_of_birth + INTERVAL '18 years' - INTERVAL '1 days'
        ELSE
            CASE type
                WHEN 'PRESCHOOL_DAYCARE' THEN ${migrationSchema:name}.preschool_daycare_end_date(start_date)
                ELSE ${migrationSchema:name}.daycare_end_date(effica_ssn, start_date)
                END
        END)
WHERE end_date IS NULL;

-- create empty todo-table
DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_placement_todo;
CREATE TABLE ${migrationSchema:name}.evaka_placement_todo AS
SELECT *, 'TODO' AS reason
FROM ${migrationSchema:name}.evaka_placement
WHERE false;

-- insert missing people to todo table
INSERT INTO ${migrationSchema:name}.evaka_placement_todo
SELECT *, 'PERSON MISSING' AS reason
FROM ${migrationSchema:name}.evaka_placement
WHERE child_id IS NULL;

-- insert missing units to todo table
INSERT INTO ${migrationSchema:name}.evaka_placement_todo
SELECT *, 'UNIT MISSING'
FROM ${migrationSchema:name}.evaka_placement
WHERE unit_id IS NULL;

-- should not migrate placements that do not have a service need set (service need is needed for varda                  )
INSERT INTO ${migrationSchema:name}.evaka_placement_todo
SELECT *, 'PLACEMENTEXTENT MISSING'
FROM ${migrationSchema:name}.evaka_placement
WHERE effica_extent_nbr IS NULL;

-- placement has a service need not defined in evaka
INSERT INTO ${migrationSchema:name}.evaka_placement_todo
SELECT *, 'PLACEMENTEXTENT MAPPING MISSING'
FROM ${migrationSchema:name}.evaka_placement
WHERE effica_extent_nbr IS NOT NULL AND option_id IS NULL;

--- insert invalid validity to todo table
INSERT INTO ${migrationSchema:name}.evaka_placement_todo
SELECT *, 'START AFTER END'
FROM ${migrationSchema:name}.evaka_placement
WHERE start_date > end_date;

-- remove problematic placements from migration at this point to filter out unnecessary overlapping placements
DELETE FROM ${migrationSchema:name}.evaka_placement
WHERE id IN (SELECT id FROM ${migrationSchema:name}.evaka_placement_todo);

-- insert overlapping placements to todo table: only the placements that have a placementextent mapped in extentmap
INSERT INTO ${migrationSchema:name}.evaka_placement_todo
SELECT DISTINCT p1.*, 'OVERLAPPING PLACEMENT'
FROM ${migrationSchema:name}.evaka_placement p1
JOIN ${migrationSchema:name}.evaka_placement p2 ON p1.effica_ssn = p2.effica_ssn
    AND p1.effica_placement_nbr <> p2.effica_placement_nbr
    AND p1.effica_extent_nbr <> p2.effica_extent_nbr
    AND p1.end_date >= p1.start_date AND p2.end_date >= p2.start_date
    AND daterange(p1.start_date, p1.end_date, '[]') && daterange(p2.start_date, p2.end_date, '[]');

-- remove problematic placements from migration
DELETE FROM ${migrationSchema:name}.evaka_placement
WHERE id IN (SELECT id FROM ${migrationSchema:name}.evaka_placement_todo);

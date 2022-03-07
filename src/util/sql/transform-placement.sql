-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_placement CASCADE;
CREATE TABLE ${migrationSchema:name}.evaka_placement (
    id UUID PRIMARY KEY DEFAULT ${extensionSchema:name}.uuid_generate_v1mc(),
    effica_placement_nbr INTEGER UNIQUE NOT NULL,
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
    child_date_of_birth DATE
);

INSERT INTO ${migrationSchema:name}.evaka_placement
    (effica_placement_nbr, effica_ssn, type, child_id, unit_id, start_date, end_date, daycare_group_id, effica_unit_id, effica_department_id, effica_childminder_id, child_date_of_birth)
SELECT
    p.placementnbr,
    p.personid,
    COALESCE((
        SELECT DISTINCT valid_placement_type
        FROM ${migrationSchema:name}.placementextents pe
        JOIN ${migrationSchema:name}.extentmap em ON em.effica_id = pe.extentcode AND em.days = pe.days
        JOIN service_need_option sno ON sno.id = em.evaka_id
        WHERE pe.placementnbr = p.placementnbr
        LIMIT 1 -- TODO: split placement with multiple types to multiple placements
    ), 'DAYCARE'),
    ep.id,
    COALESCE(um.evaka_id, cm.evaka_id),
    p.startdate,
    p.enddate,
    edg.id,
    p.placementunitcode,
    p.placementdepartmentcode,
    p.placementchildminder,
    ep.date_of_birth
FROM ${migrationSchema:name}.filtered_placements_v p
LEFT JOIN ${migrationSchema:name}.evaka_person ep ON ep.effica_ssn = p.personid
LEFT JOIN ${migrationSchema:name}.unitmap um ON um.effica_id = p.placementunitcode
LEFT JOIN ${migrationSchema:name}.evaka_daycare_group edg ON edg.effica_id = p.placementdepartmentcode
LEFT JOIN ${migrationSchema:name}.childmindermap cm ON cm.effica_id = p.placementchildminder;

-- fix null end dates from next start dates
WITH
data1 AS (
    SELECT *
    FROM ${migrationSchema:name}.evaka_placement
    WHERE end_date IS NULL
),
data2 AS (
    SELECT data1.effica_placement_nbr, MIN(data2.start_date) - INTERVAL '1 day' AS new_end_date
    FROM data1, ${migrationSchema:name}.evaka_placement data2
    WHERE data1.effica_ssn = data2.effica_ssn
    AND data1.effica_placement_nbr <> data2.effica_placement_nbr
    AND data2.start_date > data1.start_date
    GROUP BY data1.effica_placement_nbr
)
UPDATE ${migrationSchema:name}.evaka_placement
SET end_date = data2.new_end_date
FROM data2
WHERE ${migrationSchema:name}.evaka_placement.effica_placement_nbr = data2.effica_placement_nbr;

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

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_placement_todo CASCADE;

-- insert missing people to todo table
CREATE TABLE ${migrationSchema:name}.evaka_placement_todo AS
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
SELECT p.*, 'PLACEMENTEXTENT MISSING'
FROM ${migrationSchema:name}.evaka_placement p
WHERE
    NOT EXISTS (
        SELECT pe.placementnbr
        FROM ${migrationSchema:name}.placementextents pe
        WHERE p.effica_placement_nbr = pe.placementnbr
    );

-- placement has a service need not defined in evaka
INSERT INTO ${migrationSchema:name}.evaka_placement_todo
SELECT p.*, 'PLACEMENTEXTENT MAPPING MISSING'
FROM ${migrationSchema:name}.evaka_placement p
WHERE
    NOT EXISTS (
        SELECT pe.placementnbr
        FROM ${migrationSchema:name}.placementextents pe
            JOIN ${migrationSchema:name}.extentmap em ON em.effica_id = pe.extentcode AND em.days = pe.days
        WHERE pe.placementnbr = p.effica_placement_nbr
    );

-- remove problematic placements from migration at this point to filter out unnecessary overlapping placements
DELETE FROM ${migrationSchema:name}.evaka_placement
WHERE id IN (SELECT id FROM ${migrationSchema:name}.evaka_placement_todo);

-- insert overlapping placements to todo table: only the placements that have a placementextent mapped in extentmap
INSERT INTO ${migrationSchema:name}.evaka_placement_todo
SELECT DISTINCT p1.*, 'OVERLAPPING PLACEMENT'
FROM ${migrationSchema:name}.evaka_placement p1
JOIN ${migrationSchema:name}.evaka_placement p2 ON p1.effica_ssn = p2.effica_ssn
    AND p1.effica_placement_nbr <> p2.effica_placement_nbr
    AND p1.end_date >= p1.start_date AND p2.end_date >= p2.start_date
    AND daterange(p1.start_date, p1.end_date, '[]') && daterange(p2.start_date, p2.end_date, '[]')
WHERE
    EXISTS (
        SELECT em1.effica_id
        FROM ${migrationSchema:name}.placementextents pe1
        JOIN ${migrationSchema:name}.extentmap em1 ON em1.effica_id = pe1.extentcode AND em1.days = pe1.days
        WHERE p1.effica_placement_nbr = pe1.placementnbr
    ) AND
    EXISTS (
        SELECT em2.effica_id
        FROM ${migrationSchema:name}.placementextents pe2
        JOIN ${migrationSchema:name}.extentmap em2 ON em2.effica_id = pe2.extentcode AND em2.days = pe2.days
        WHERE p2.effica_placement_nbr = pe2.placementnbr
    );

-- remove problematic placements from migration
DELETE FROM ${migrationSchema:name}.evaka_placement
WHERE id IN (SELECT id FROM ${migrationSchema:name}.evaka_placement_todo);

-- fix transfer applications
UPDATE ${migrationSchema:name}.evaka_application ea
SET transferapplication = TRUE
FROM (
    SELECT application_id, MIN(effica_priority) AS top_priority
    FROM ${migrationSchema:name}.evaka_application_form
    GROUP BY application_id
) priorities
JOIN ${migrationSchema:name}.evaka_application_form eaf
    ON eaf.application_id = priorities.application_id AND eaf.effica_priority = priorities.top_priority
WHERE eaf.application_id = ea.id AND priorities.application_id = ea.id AND EXISTS (
    SELECT 1
    FROM ${migrationSchema:name}.evaka_placement ep
    WHERE ep.child_id = ea.child_id
        AND CASE ep.type
            WHEN 'DAYCARE_PART_TIME' THEN 'DAYCARE'
            WHEN 'DAYCARE_FIVE_YEAR_OLDS' THEN 'DAYCARE'
            WHEN 'DAYCARE_PART_TIME_FIVE_YEAR_OLDS' THEN 'DAYCARE'
            ELSE ep.type
            END = ea.type
        AND daterange(ep.start_date, ep.end_date, '[]') @> eaf.preferred_start_date
);

-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

CREATE OR REPLACE VIEW ${migrationSchema:name}.dailyjournals_view AS
WITH rows AS (
    SELECT
        dailyjournalid,
        personid,
        unnest(ARRAY[
            '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
            '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
            '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31'
        ]) AS day_of_month,
        unnest(ARRAY[
            reportcode01, reportcode02, reportcode03, reportcode04, reportcode05,
            reportcode06, reportcode07, reportcode08, reportcode09, reportcode10,
            reportcode11, reportcode12, reportcode13, reportcode14, reportcode15,
            reportcode16, reportcode17, reportcode18, reportcode19, reportcode20,
            reportcode21, reportcode22, reportcode23, reportcode24, reportcode25,
            reportcode26, reportcode27, reportcode28, reportcode29, reportcode30, reportcode31
        ]) AS reportcode
    FROM ${migrationSchema:name}.dailyjournalrows
)
SELECT
    d.dailyjournalid,
    d.unit,
    d.department,
    d.childminder,
    COALESCE(um.evaka_id, cm.evaka_id) AS unit_id,
    r.personid,
    (d.period || r.day_of_month)::date AS date,
    r.reportcode
FROM rows r
JOIN ${migrationSchema:name}.dailyjournals d ON d.dailyjournalid = r.dailyjournalid
LEFT JOIN ${migrationSchema:name}.unitmap um ON um.effica_id = d.unit
LEFT JOIN ${migrationSchema:name}.childmindermap cm ON cm.effica_id = d.childminder
LEFT JOIN ${migrationSchema:name}.evaka_daycare ed ON ed.id = um.evaka_id OR ed.id = cm.evaka_id
WHERE r.reportcode != 0 AND (ed.id IS NULL OR NOT 'CLUB' = ANY(ed.type));

-- absences

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_absence;
CREATE TABLE ${migrationSchema:name}.evaka_absence (
    id UUID PRIMARY KEY DEFAULT ${extensionSchema:name}.uuid_generate_v1mc(),
    effica_dailyjournalids INTEGER[] NOT NULL,
    child_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    date DATE NOT NULL,
    care_type TEXT NOT NULL,
    absence_type TEXT
);

WITH absences AS (
    SELECT
        d.dailyjournalid,
        child.id AS child_id,
        d.date,
        unnest(CASE ep.type
            WHEN 'CLUB' THEN ARRAY['CLUB']
            WHEN 'SCHOOL_SHIFT_CARE' THEN ARRAY['SCHOOL_SHIFT_CARE']
            WHEN 'PRESCHOOL' THEN ARRAY['PRESCHOOL']
            WHEN 'PREPARATORY' THEN ARRAY['PRESCHOOL']
            WHEN 'PRESCHOOL_DAYCARE' THEN ARRAY['PRESCHOOL_DAYCARE'] -- PRESCHOOL for non billable
            WHEN 'PREPARATORY_DAYCARE' THEN ARRAY['PRESCHOOL_DAYCARE'] -- PRESCHOOL for non billable
            WHEN 'DAYCARE' THEN ARRAY['DAYCARE']
            WHEN 'DAYCARE_PART_TIME' THEN ARRAY['DAYCARE']
            WHEN 'DAYCARE_FIVE_YEAR_OLDS' THEN ARRAY['DAYCARE'] -- DAYCARE_5YO_FREE for non billable
            WHEN 'DAYCARE_PART_TIME_FIVE_YEAR_OLDS' THEN ARRAY['DAYCARE'] -- DAYCARE_5YO_FREE for non billable
            WHEN 'TEMPORARY_DAYCARE' THEN ARRAY['DAYCARE']
            WHEN 'TEMPORARY_DAYCARE_PART_DAY' THEN ARRAY['DAYCARE']
            ELSE ARRAY['UNKNOWN']
        END) AS care_type,
        $(absenceTypeMappings:json)::jsonb ->> d.reportcode::text AS absence_type
    FROM ${migrationSchema:name}.dailyjournals_view d
    LEFT JOIN ${migrationSchema:name}.evaka_person child ON child.effica_ssn = d.personid
    LEFT JOIN ${migrationSchema:name}.evaka_placement ep ON ep.child_id = child.id
        AND daterange(ep.start_date, ep.end_date, '[]') @> d.date
    WHERE $(absenceTypeMappings:json)::jsonb ->> d.reportcode::text IS NOT NULL -- include all known absence types
        OR d.reportcode::text NOT IN ($(allReportCodes:csv)) -- include all unknown reportcodes
)
INSERT INTO ${migrationSchema:name}.evaka_absence
    (effica_dailyjournalids, child_id, date, care_type, absence_type)
SELECT DISTINCT
    array_agg(DISTINCT dailyjournalid),
    child_id,
    date,
    care_type,
    (array_agg(absence_type))[1]
FROM absences a
GROUP BY child_id, date, care_type;

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_absence_todo;

CREATE TABLE ${migrationSchema:name}.evaka_absence_todo AS
SELECT *, 'CHILD MISSING' AS reason
FROM ${migrationSchema:name}.evaka_absence WHERE child_id IS NULL;

INSERT INTO ${migrationSchema:name}.evaka_absence_todo
SELECT *, 'PLACEMENT MISSING'
FROM ${migrationSchema:name}.evaka_absence WHERE care_type = 'UNKNOWN';

INSERT INTO ${migrationSchema:name}.evaka_absence_todo
SELECT *, 'TYPE MISSING'
FROM ${migrationSchema:name}.evaka_absence WHERE absence_type IS NULL;

DELETE FROM ${migrationSchema:name}.evaka_absence
WHERE id IN (SELECT id FROM ${migrationSchema:name}.evaka_absence_todo);

-- backup cares

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_backup_care;
CREATE TABLE ${migrationSchema:name}.evaka_backup_care (
    id UUID PRIMARY KEY DEFAULT ${extensionSchema:name}.uuid_generate_v1mc(),
    child_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    unit_id UUID REFERENCES ${migrationSchema:name}.evaka_daycare,
    group_id UUID REFERENCES ${migrationSchema:name}.evaka_daycare_group,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

WITH backup_cares AS (
    SELECT
        child.id AS child_id,
        d.unit_id,
        edg.id AS group_id,
        d.date,
        ROW_NUMBER() OVER(PARTITION BY child.id, d.unit_id, edg.id ORDER BY d.date) AS days
    FROM ${migrationSchema:name}.dailyjournals_view d
    LEFT JOIN ${migrationSchema:name}.evaka_person child ON child.effica_ssn = d.personid
    LEFT JOIN ${migrationSchema:name}.evaka_daycare_group edg ON edg.effica_id = d.department
    WHERE d.reportcode IN ($(backupCareTypes:csv))
    GROUP BY child_id, unit_id, group_id, d.date
)
INSERT INTO ${migrationSchema:name}.evaka_backup_care
    (child_id, unit_id, group_id, start_date, end_date)
SELECT DISTINCT
    child_id,
    unit_id,
    group_id,
    min(date),
    max(date)
FROM backup_cares
GROUP BY child_id, unit_id, group_id, date - (days || ' days')::interval;

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_backup_care_todo;

CREATE TABLE ${migrationSchema:name}.evaka_backup_care_todo AS
SELECT *, 'CHILD MISSING' AS reason
FROM ${migrationSchema:name}.evaka_backup_care WHERE child_id IS NULL;

INSERT INTO ${migrationSchema:name}.evaka_backup_care_todo
SELECT *, 'UNIT MISSING'
FROM ${migrationSchema:name}.evaka_backup_care WHERE unit_id IS NULL;

INSERT INTO ${migrationSchema:name}.evaka_backup_care_todo
SELECT DISTINCT bc1.*, 'OVERLAPPING BACKUP CARE'
FROM ${migrationSchema:name}.evaka_backup_care bc1
JOIN ${migrationSchema:name}.evaka_backup_care bc2 ON bc1.child_id = bc2.child_id
    AND bc1.id != bc2.id
    AND daterange(bc1.start_date, bc1.end_date, '[]') && daterange(bc2.start_date, bc2.end_date, '[]');

DELETE FROM ${migrationSchema:name}.evaka_backup_care
WHERE id IN (SELECT id FROM ${migrationSchema:name}.evaka_backup_care_todo);

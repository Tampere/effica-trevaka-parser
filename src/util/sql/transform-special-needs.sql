-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_assistance_need;
CREATE TABLE ${migrationSchema:name}.evaka_assistance_need (
    id UUID PRIMARY KEY DEFAULT ${extensionSchema:name}.uuid_generate_v1mc(),
    effica_ssn TEXT NOT NULL,
    child_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    bases TEXT[] NOT NULL
);

WITH
calendar AS (
    -- create full calendar from date ranges
    SELECT
        personid,
        (generate_series(startdate, COALESCE(enddate, '2025-12-31'::date), interval '1 day'))::date AS date,
        $(typeMappings:json)::jsonb ->> specialneedcode::text AS basis
    FROM ${migrationSchema:name}.specialneeds
),
groups AS (
    -- group calendar by person and date
    SELECT
        personid,
        date,
        array_agg(DISTINCT basis ORDER BY basis) FILTER (WHERE basis IS NOT NULL) AS bases,
        -- add row number based on date to find gaps and islands
        ROW_NUMBER() OVER(
            PARTITION BY
                personid,
                array_agg(DISTINCT basis ORDER BY basis) FILTER (WHERE basis IS NOT NULL)
            ORDER BY date
        ) AS days
    FROM calendar
    WHERE basis IS NOT NULL
    GROUP BY personid, date
)
INSERT INTO ${migrationSchema:name}.evaka_assistance_need
    (effica_ssn, child_id, start_date, end_date, bases)
SELECT
    g.personid,
    child.id,
    min(g.date),
    max(g.date),
    g.bases
FROM groups g
LEFT JOIN ${migrationSchema:name}.evaka_person child ON child.effica_ssn = g.personid
GROUP BY g.personid, child.id, date - (days || ' days')::interval, g.bases;

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_assistance_need_todo;
CREATE TABLE ${migrationSchema:name}.evaka_assistance_need_todo AS
SELECT *, 'TODO TABLE' AS reason
FROM ${migrationSchema:name}.evaka_assistance_need
WHERE 1 = 2;

INSERT INTO ${migrationSchema:name}.evaka_assistance_need_todo
SELECT *, 'PERSON MISSING'
FROM ${migrationSchema:name}.evaka_assistance_need
WHERE child_id IS NULL;

DELETE FROM ${migrationSchema:name}.evaka_assistance_need
WHERE id IN (SELECT id FROM ${migrationSchema:name}.evaka_assistance_need_todo);

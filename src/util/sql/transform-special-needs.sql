-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_assistance_need;
CREATE TABLE ${migrationSchema:name}.evaka_assistance_need (
    id UUID PRIMARY KEY DEFAULT ${extensionSchema:name}.uuid_generate_v1mc(),
    effica_ssn TEXT,
    child_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    bases TEXT[] NOT NULL
);

WITH
calendar AS (
    -- create full calendar from date ranges
    SELECT
        child.effica_ssn,
        child.id AS child_id,
        (
            generate_series(
                sn.startdate,
                COALESCE(
                    sn.enddate,
                    make_date(date_part('year', child.date_of_birth)::int, 7, 31) + interval '6 years',
                    sn.startdate + interval '6 years' - interval '1 day' -- child may be null
                ),
                interval '1 day'
            )
        )::date AS date,
        $(typeMappings:json)::jsonb ->> sn.specialneedcode::text AS basis
    FROM ${migrationSchema:name}.specialneeds sn
    LEFT JOIN ${migrationSchema:name}.evaka_person child ON child.effica_ssn = sn.personid
),
groups AS (
    -- group calendar by person and date
    SELECT
        effica_ssn,
        child_id,
        date,
        array_agg(DISTINCT basis ORDER BY basis) FILTER (WHERE basis IS NOT NULL) AS bases,
        -- add row number based on date to find gaps and islands
        ROW_NUMBER() OVER(
            PARTITION BY
                effica_ssn,
                child_id,
                array_agg(DISTINCT basis ORDER BY basis) FILTER (WHERE basis IS NOT NULL)
            ORDER BY date
        ) AS days
    FROM calendar
    WHERE basis IS NOT NULL
    GROUP BY effica_ssn, child_id, date
)
INSERT INTO ${migrationSchema:name}.evaka_assistance_need
    (effica_ssn, child_id, start_date, end_date, bases)
SELECT
    effica_ssn,
    child_id,
    min(date),
    max(date),
    bases
FROM groups
GROUP BY effica_ssn, child_id, date - (days || ' days')::interval, bases;

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

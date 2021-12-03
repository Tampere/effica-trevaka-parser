-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_assistance_action;
CREATE TABLE ${migrationSchema:name}.evaka_assistance_action (
    id UUID PRIMARY KEY DEFAULT ${extensionSchema:name}.uuid_generate_v1mc(),
    effica_ssn TEXT NOT NULL,
    child_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    actions TEXT[] NOT NULL
);

WITH
calendar AS (
    -- create full calendar from date ranges
    SELECT
        personid,
        (generate_series(startdate, enddate, interval '1 day'))::date AS date,
        $(typeMappings:json)::jsonb ->> mean::text AS action
    FROM ${migrationSchema:name}.specialmeans
),
groups AS (
    -- group calendar by person and date
    SELECT
        personid,
        date,
        array_agg(DISTINCT action ORDER BY action) FILTER (WHERE action IS NOT NULL) AS actions,
        -- add row number based on date to find gaps and islands
        ROW_NUMBER() OVER(
            PARTITION BY
                personid,
                array_agg(DISTINCT action ORDER BY action) FILTER (WHERE action IS NOT NULL)
            ORDER BY date
        ) AS days
    FROM calendar
    WHERE action IS NOT NULL
    GROUP BY personid, date
)
INSERT INTO ${migrationSchema:name}.evaka_assistance_action
    (effica_ssn, child_id, start_date, end_date, actions)
SELECT
    g.personid,
    child.id,
    min(g.date),
    max(g.date),
    g.actions
FROM groups g
LEFT JOIN ${migrationSchema:name}.evaka_person child ON child.effica_ssn = g.personid
GROUP BY g.personid, child.id, date - (days || ' days')::interval, g.actions;

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_assistance_action_todo;
CREATE TABLE ${migrationSchema:name}.evaka_assistance_action_todo AS
SELECT *, 'TODO TABLE' AS reason
FROM ${migrationSchema:name}.evaka_assistance_action
WHERE 1 = 2;

INSERT INTO ${migrationSchema:name}.evaka_assistance_action_todo
SELECT *, 'PERSON MISSING'
FROM ${migrationSchema:name}.evaka_assistance_action
WHERE child_id IS NULL;

DELETE FROM ${migrationSchema:name}.evaka_assistance_action
WHERE id IN (SELECT id FROM ${migrationSchema:name}.evaka_assistance_action_todo);

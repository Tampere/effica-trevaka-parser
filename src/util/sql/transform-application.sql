-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

-- applications

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_application CASCADE;
CREATE TABLE ${migrationSchema:name}.evaka_application (
    id UUID PRIMARY KEY,
    effica_guid TEXT,
    effica_id INTEGER NOT NULL,
    type TEXT CHECK (type IN ('CLUB', 'DAYCARE', 'PRESCHOOL')),
    sentdate DATE NOT NULL,
    duedate DATE,
    guardian_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    child_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    transferapplication BOOLEAN NOT NULL,
    status TEXT NOT NULL
);

INSERT INTO ${migrationSchema:name}.evaka_application
    (id, effica_guid, effica_id, type, sentdate, duedate, guardian_id, child_id, transferapplication, status)
SELECT
    ${extensionSchema:name}.uuid_generate_v1mc(),
    a.guid,
    a.careid,
    $(typeMappings:json)::jsonb ->> a.applicationtype::text,
    a.applicationdate,
    CASE WHEN specialhandlingtime.extrainfo1 IS NOT NULL THEN a.applicationdate + (specialhandlingtime.extrainfo1 || ' days')::interval END,
    g.id,
    c.id,
    a.transferapplication,
    $(statusMappings:json)::jsonb ->> a.status::text
FROM ${migrationSchema:name}.applications a
LEFT JOIN ${migrationSchema:name}.codes specialhandlingtime ON specialhandlingtime.code = a.specialhandlingtime
LEFT JOIN ${migrationSchema:name}.evaka_person c ON c.effica_ssn = a.personid
LEFT JOIN ${migrationSchema:name}.evaka_fridge_child fc ON fc.child_id = c.id
    AND a.applicationdate BETWEEN fc.start_date AND fc.end_date
LEFT JOIN ${migrationSchema:name}.evaka_person g ON g.id = fc.head_of_family
WHERE
    (
        $(typeMappings:json)::jsonb ->> a.applicationtype::text IS NOT NULL OR -- include all mapped types
        a.applicationtype::text NOT IN ($(allTypes:csv)) -- include all unknown types
    )
    AND a.status::text IN (SELECT code FROM jsonb_object_keys($(statusMappings:json)) AS code);

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_application_todo CASCADE;

CREATE TABLE ${migrationSchema:name}.evaka_application_todo AS
SELECT *, 'GUARDIAN MISSING' AS reason
FROM ${migrationSchema:name}.evaka_application
WHERE guardian_id IS NULL;

INSERT INTO ${migrationSchema:name}.evaka_application_todo
SELECT *, 'CHILD MISSING'
FROM ${migrationSchema:name}.evaka_application
WHERE child_id IS NULL;

INSERT INTO ${migrationSchema:name}.evaka_application_todo
SELECT *, 'TYPE MISSING'
FROM ${migrationSchema:name}.evaka_application
WHERE type IS NULL;

DELETE FROM ${migrationSchema:name}.evaka_application
WHERE id IN (SELECT id FROM ${migrationSchema:name}.evaka_application_todo);

-- application rows

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_application_form CASCADE;
CREATE TABLE ${migrationSchema:name}.evaka_application_form (
    effica_application_id INTEGER NOT NULL,
    effica_priority INTEGER NOT NULL,
    application_id UUID NOT NULL REFERENCES ${migrationSchema:name}.evaka_application,
    unit_id UUID REFERENCES ${migrationSchema:name}.evaka_daycare,
    service_need_option_id UUID,
    preferred_start_date DATE NOT NULL,
    PRIMARY KEY (effica_application_id, effica_priority),
    effica_unit_id INTEGER,
    effica_childminder_id TEXT
);

INSERT INTO ${migrationSchema:name}.evaka_application_form
    (effica_application_id, effica_priority, application_id, unit_id, service_need_option_id, preferred_start_date, effica_unit_id, effica_childminder_id)
SELECT
    r.careid,
    r.priority,
    ea.id,
    CASE r.childmindercare
        WHEN '1' THEN ${childminderApplicationUnit}
        ELSE um.evaka_id
    END,
    em.evaka_id,
    r.startdate,
    r.unitcode,
    r.childminder
FROM ${migrationSchema:name}.applicationrows r
JOIN ${migrationSchema:name}.evaka_application ea ON ea.effica_id = r.careid
LEFT JOIN ${migrationSchema:name}.unitmap um ON um.effica_id = r.unitcode
LEFT JOIN ${migrationSchema:name}.extentmap em ON em.effica_id = r.extent AND em.days = r.days;

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_application_form_todo CASCADE;

CREATE TABLE ${migrationSchema:name}.evaka_application_form_todo AS
SELECT *, 'UNIT MISSING' AS reason
FROM ${migrationSchema:name}.evaka_application_form
WHERE unit_id IS NULL;

DELETE FROM ${migrationSchema:name}.evaka_application_form
WHERE (effica_application_id, effica_priority) IN (
    SELECT effica_application_id, effica_priority
    FROM ${migrationSchema:name}.evaka_application_form_todo
);

-- fix due date based on sent date and preferred start date
UPDATE ${migrationSchema:name}.evaka_application ea
SET duedate = CASE
    WHEN ea.sentdate + '120 days'::interval > eaf.preferred_start_date THEN ea.sentdate + '120 days'::interval
    ELSE eaf.preferred_start_date
END
FROM ${migrationSchema:name}.evaka_application_form eaf
WHERE eaf.application_id = ea.id AND eaf.effica_priority = 1 AND ea.duedate IS NULL;

-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

-- applications

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_application CASCADE;
CREATE TABLE ${migrationSchema:name}.evaka_application (
    id UUID PRIMARY KEY DEFAULT ${extensionSchema:name}.uuid_generate_v1mc(),
    effica_id INTEGER NOT NULL,
    sentdate DATE NOT NULL,
    guardian_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    child_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    transferapplication BOOLEAN NOT NULL,
    status TEXT NOT NULL
);

INSERT INTO ${migrationSchema:name}.evaka_application
    (effica_id, sentdate, guardian_id, child_id, transferapplication, status)
SELECT
    a.careid,
    a.applicationdate,
    g.id,
    c.id,
    a.transferapplication,
    $(statusMappings:json)::jsonb ->> a.status::text
FROM ${migrationSchema:name}.applications a
LEFT JOIN ${migrationSchema:name}.evaka_person c ON c.effica_ssn = a.personid
LEFT JOIN ${migrationSchema:name}.evaka_fridge_child fc ON fc.child_id = c.id
    AND a.applicationdate BETWEEN fc.start_date AND fc.end_date
LEFT JOIN ${migrationSchema:name}.evaka_person g ON g.id = fc.head_of_family
WHERE a.status::text IN (SELECT code FROM jsonb_object_keys($(statusMappings:json)) AS code);

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_application_todo CASCADE;

CREATE TABLE ${migrationSchema:name}.evaka_application_todo AS
SELECT *, 'GUARDIAN MISSING' AS reason
FROM ${migrationSchema:name}.evaka_application
WHERE guardian_id IS NULL;

INSERT INTO ${migrationSchema:name}.evaka_application_todo
SELECT *, 'CHILD MISSING'
FROM ${migrationSchema:name}.evaka_application
WHERE child_id IS NULL;

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
    type TEXT NOT NULL,
    PRIMARY KEY (effica_application_id, effica_priority)
);

INSERT INTO ${migrationSchema:name}.evaka_application_form
    (effica_application_id, effica_priority, application_id, unit_id, service_need_option_id, preferred_start_date, type)
SELECT
    r.careid,
    r.priority,
    ea.id,
    COALESCE(um.evaka_id, cm.evaka_id),
    em.evaka_id,
    r.startdate,
    CASE r.type
        WHEN 'BOA' THEN 'DAYCARE'
        WHEN 'PRO' THEN 'DAYCARE'
        WHEN 'BOK' THEN 'CLUB'
        ELSE 'DAYCARE'
    END
FROM ${migrationSchema:name}.applicationrows r
JOIN ${migrationSchema:name}.evaka_application ea ON ea.effica_id = r.careid
LEFT JOIN ${migrationSchema:name}.unitmap um ON um.effica_id = r.unitcode
LEFT JOIN ${migrationSchema:name}.childmindermap cm ON cm.effica_id = r.childminder
LEFT JOIN ${migrationSchema:name}.extentmap em ON em.effica_id = r.extent AND em.days = r.days;

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_application_form_todo CASCADE;

CREATE TABLE ${migrationSchema:name}.evaka_application_form_todo AS
SELECT *, 'UNIT MISSING' AS reason
FROM ${migrationSchema:name}.evaka_application_form
WHERE unit_id IS NULL;

INSERT INTO ${migrationSchema:name}.evaka_application_form_todo
SELECT *, 'SERVICE NEED OPTION MISSING'
FROM ${migrationSchema:name}.evaka_application_form
WHERE service_need_option_id IS NULL;

DELETE FROM ${migrationSchema:name}.evaka_application_form
WHERE (effica_application_id, effica_priority) IN (
    SELECT effica_application_id, effica_priority
    FROM ${migrationSchema:name}.evaka_application_form_todo
);

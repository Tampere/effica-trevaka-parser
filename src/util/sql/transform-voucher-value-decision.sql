-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_voucher_value_decision CASCADE;
CREATE TABLE ${migrationSchema:name}.evaka_voucher_value_decision(
    id UUID PRIMARY KEY,
    effica_guid TEXT,
    effica_ssn TEXT,
    effica_decision_date DATE,
    status TEXT,
    status_group TEXT,
    valid_from DATE,
    valid_to DATE,
    decision_number BIGINT,
    head_of_family_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    partner_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    family_size INTEGER NOT NULL,
    child_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    child_date_of_birth DATE,
    base_co_payment INTEGER NOT NULL,
    sibling_discount INTEGER NOT NULL,
    placement_unit_id UUID,
    service_need_option_id UUID,
    co_payment INTEGER NOT NULL,
    voucher_value INTEGER NOT NULL,
    final_co_payment INTEGER NOT NULL,
    capacity_factor NUMERIC(4, 2) NOT NULL,
    CHECK (head_of_family_id != partner_id),
    effica_unit_id INTEGER,
    effica_childminder_id TEXT
);

INSERT INTO ${migrationSchema:name}.evaka_voucher_value_decision (
    id,
    effica_guid,
    effica_ssn,
    effica_decision_date,
    status,
    status_group,
    valid_from,
    valid_to,
    decision_number,
    head_of_family_id,
    partner_id,
    family_size,
    child_id,
    child_date_of_birth,
    base_co_payment,
    sibling_discount,
    placement_unit_id,
    service_need_option_id,
    co_payment,
    voucher_value,
    final_co_payment,
    capacity_factor,
    effica_unit_id,
    effica_childminder_id
) SELECT
    ${extensionSchema:name}.uuid_generate_v1mc(),
    d.guid,
    d.personid,
    d.decisiondate,
    $(statusMappings:json)::jsonb ->> d.decisionstatus::text,
    CASE $(statusMappings:json)::jsonb ->> d.decisionstatus::text
        WHEN 'DRAFT' THEN 'DRAFT'
        WHEN 'SENT' THEN 'APPROVED'
        WHEN 'WAITING_FOR_SENDING' THEN 'APPROVED'
        WHEN 'WAITING_FOR_MANUAL_SENDING' THEN 'APPROVED'
    END,
    d.startdate,
    d.enddate,
    d.decisionnbr,
    f_child.head_of_family,
    f_partner2.person_id,
    d.familysize,
    child.id,
    child.date_of_birth,
    0, -- TODO: base co payment
    0, -- TODO: sibling discount
    COALESCE(um.evaka_id, cm.evaka_id),
    em.evaka_id,
    0, -- TODO: co payment
    d.totalsum * 100,
    d.paydecision * 100,
    d.factor,
    d.decisionunitcode,
    d.decisionchildminder
FROM ${migrationSchema:name}.decisions d
LEFT JOIN ${migrationSchema:name}.evaka_fridge_child f_child ON f_child.child_ssn = d.personid
    AND daterange(f_child.start_date, f_child.end_date, '[]') @> d.decisiondate
LEFT JOIN ${migrationSchema:name}.evaka_fridge_partner f_partner1 ON f_partner1.person_id = f_child.head_of_family
    AND daterange(f_partner1.start_date, f_partner1.end_date, '[]') @> d.decisiondate
LEFT JOIN ${migrationSchema:name}.evaka_fridge_partner f_partner2 ON f_partner2.partnership_id = f_partner1.partnership_id
    AND f_partner2.indx != f_partner1.indx
LEFT JOIN ${migrationSchema:name}.evaka_person child ON child.effica_ssn = d.personid
LEFT JOIN ${migrationSchema:name}.unitmap um ON um.effica_id = d.decisionunitcode
LEFT JOIN ${migrationSchema:name}.childmindermap cm ON cm.effica_id = d.decisionchildminder
LEFT JOIN ${migrationSchema:name}.extentmap em ON em.effica_id = d.extent AND em.days = d.days
WHERE decisiontype IN ($(types:csv))
    AND (
        $(statusMappings:json)::jsonb ->> d.decisionstatus::text IS NOT NULL OR -- include all mapped statuses
        d.decisionstatus::text NOT IN ($(allStatuses:csv)) -- include all unknown statuses
    );

-- fix null end dates from next start dates
WITH
data1 AS (
    SELECT *
    FROM ${migrationSchema:name}.evaka_voucher_value_decision
    WHERE valid_to IS NULL AND status_group IS NOT NULL
),
data2 AS (
    SELECT data1.effica_ssn, data1.status_group, data1.decision_number, MIN(data2.valid_from) - INTERVAL '1 day' AS new_valid_to
    FROM data1, ${migrationSchema:name}.evaka_voucher_value_decision data2
    WHERE data1.effica_ssn = data2.effica_ssn
    AND data1.status_group = data2.status_group
    AND data1.decision_number <> data2.decision_number
    AND data2.valid_from > data1.valid_from
    GROUP BY data1.effica_ssn, data1.status_group, data1.decision_number
)
UPDATE ${migrationSchema:name}.evaka_voucher_value_decision
SET valid_to = data2.new_valid_to
FROM data2
WHERE ${migrationSchema:name}.evaka_voucher_value_decision.effica_ssn = data2.effica_ssn
AND ${migrationSchema:name}.evaka_voucher_value_decision.status_group = data2.status_group
AND ${migrationSchema:name}.evaka_voucher_value_decision.decision_number = data2.decision_number;

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_voucher_value_decision_todo;

-- insert decisions with missing status to todo table
CREATE TABLE ${migrationSchema:name}.evaka_voucher_value_decision_todo AS
SELECT *, 'STATUS MISSING' AS reason
FROM ${migrationSchema:name}.evaka_voucher_value_decision
WHERE status IS NULL;

-- insert missing people to todo table
INSERT INTO ${migrationSchema:name}.evaka_voucher_value_decision_todo
SELECT *, 'HEAD OF FAMILY MISSING'
FROM ${migrationSchema:name}.evaka_voucher_value_decision
WHERE head_of_family_id IS NULL;
INSERT INTO ${migrationSchema:name}.evaka_voucher_value_decision_todo
SELECT *, 'CHILD MISSING'
FROM ${migrationSchema:name}.evaka_voucher_value_decision
WHERE child_id IS NULL;

-- insert missing units to todo table
INSERT INTO ${migrationSchema:name}.evaka_voucher_value_decision_todo
SELECT *, 'UNIT MISSING'
FROM ${migrationSchema:name}.evaka_voucher_value_decision
WHERE placement_unit_id IS NULL;

-- insert missing service need options to todo table
INSERT INTO ${migrationSchema:name}.evaka_voucher_value_decision_todo
SELECT *, 'SERVICE NEED OPTION MISSING'
FROM ${migrationSchema:name}.evaka_voucher_value_decision
WHERE service_need_option_id IS NULL;

-- insert invalid validity to todo table
INSERT INTO ${migrationSchema:name}.evaka_voucher_value_decision_todo
SELECT *, 'START AFTER END'
FROM ${migrationSchema:name}.evaka_voucher_value_decision
WHERE valid_from > valid_to;

-- insert invalid family size to todo table
INSERT INTO ${migrationSchema:name}.evaka_voucher_value_decision_todo
SELECT *, 'INVALID FAMILY SIZE'
FROM ${migrationSchema:name}.evaka_voucher_value_decision
WHERE family_size <= 1;

-- insert overlapping decisions to todo table
INSERT INTO ${migrationSchema:name}.evaka_voucher_value_decision_todo
SELECT DISTINCT d1.*, 'OVERLAPPING DECISION'
FROM ${migrationSchema:name}.evaka_voucher_value_decision d1
JOIN ${migrationSchema:name}.evaka_voucher_value_decision d2 ON d1.effica_ssn = d2.effica_ssn
    AND d1.status_group = d2.status_group
    AND d1.decision_number <> d2.decision_number
    AND (d1.valid_from <= d1.valid_to OR d1.valid_from IS NULL OR d1.valid_to IS NULL)
    AND (d2.valid_from <= d2.valid_to OR d2.valid_from IS NULL OR d2.valid_to IS NULL)
    AND daterange(d1.valid_from, d1.valid_to, '[]') && daterange(d2.valid_from, d2.valid_to, '[]');

-- remove problematic decisions from migration
DELETE FROM ${migrationSchema:name}.evaka_voucher_value_decision
WHERE id IN (SELECT id FROM ${migrationSchema:name}.evaka_voucher_value_decision_todo);

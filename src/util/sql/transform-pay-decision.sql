-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

-- pay decision -> fee decision

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_fee_decision CASCADE;
CREATE TABLE ${migrationSchema:name}.evaka_fee_decision (
    id UUID PRIMARY KEY,
    effica_guid TEXT,
    effica_internal_decision_number INTEGER UNIQUE NOT NULL,
    effica_ssn TEXT NOT NULL,
    status TEXT,
    status_group TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    decision_type TEXT NOT NULL,
    head_of_family_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    head_of_family_income JSONB,
    partner_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    partner_income JSONB,
    family_size INTEGER,
    decision_number BIGINT NOT NULL,
    CHECK (head_of_family_id != partner_id)
);

INSERT INTO ${migrationSchema:name}.evaka_fee_decision
    (id, effica_guid, effica_internal_decision_number, effica_ssn, status, status_group, start_date, end_date, decision_type, head_of_family_id, head_of_family_income, partner_id, partner_income, family_size, decision_number)
SELECT
    ${extensionSchema:name}.uuid_generate_v1mc(),
    pd.guid,
    pd.internaldecisionnumber,
    pd.headoffamily,
    $(statusMappings:json)::jsonb ->> pd.status::text,
    CASE $(statusMappings:json)::jsonb ->> pd.status::text
        WHEN 'DRAFT' THEN 'DRAFT'
        WHEN 'SENT' THEN 'SENT'
        WHEN 'WAITING_FOR_SENDING' THEN 'SENT'
        WHEN 'WAITING_FOR_MANUAL_SENDING' THEN 'SENT'
    END,
    pd.startdate,
    pd.enddate,
    'NORMAL',
    head_of_family.id,
    CASE
        WHEN head_of_family_row.income = 999999 THEN jsonb_build_object(
            'effect', 'MAX_FEE_ACCEPTED',
            'data', jsonb_build_object(),
            'totalIncome', 0,
            'totalExpenses', 0,
            'total', 0,
            'worksAtECHA', false,
            'validFrom', null,
            'validTo', null
        )
        WHEN head_of_family_row.income IS NOT NULL THEN jsonb_build_object(
            'effect', 'INCOME',
            'data', jsonb_build_object(
                $(incomeType), head_of_family_row.income * 100
            ),
            'totalIncome', head_of_family_row.income * 100,
            'totalExpenses', 0,
            'total', head_of_family_row.income * 100,
            'worksAtECHA', false,
            'validFrom', null,
            'validTo', null
        )
    END,
    partner.id,
    CASE
        WHEN partner_row.income = 999999 THEN jsonb_build_object(
            'effect', 'MAX_FEE_ACCEPTED',
            'data', jsonb_build_object(),
            'totalIncome', 0,
            'totalExpenses', 0,
            'total', 0,
            'worksAtECHA', false,
            'validFrom', null,
            'validTo', null
        )
        WHEN partner_row.income IS NOT NULL THEN jsonb_build_object(
            'effect', 'INCOME',
            'data', jsonb_build_object(
                $(incomeType), partner_row.income * 100
            ),
            'totalIncome', partner_row.income * 100,
            'totalExpenses', 0,
            'total', partner_row.income * 100,
            'worksAtECHA', false,
            'validFrom', null,
            'validTo', null
        )
    END,
    (SELECT (regexp_matches(family_size_row.specification, '^Perhekoko (\d+)'))[1])::int,
    pd.decisionnumber
FROM ${migrationSchema:name}.paydecisions pd
LEFT JOIN ${migrationSchema:name}.evaka_person head_of_family ON head_of_family.effica_ssn = pd.headoffamily
LEFT JOIN (
    SELECT *
    FROM ${migrationSchema:name}.paydecisionrows
    WHERE rowtype IN (1, 2) -- for some reason head of family can be in both rowtypes (and so can partner)
) head_of_family_row ON head_of_family_row.internalid = pd.internaldecisionnumber AND head_of_family_row.person = pd.headoffamily
LEFT JOIN (
    SELECT *
    FROM ${migrationSchema:name}.paydecisionrows
    WHERE rowtype IN (1, 2) -- for some reason partner can be in both rowtypes (and so can head of family)
) partner_row ON partner_row.internalid = pd.internaldecisionnumber AND partner_row.person != pd.headoffamily
LEFT JOIN ${migrationSchema:name}.evaka_person partner ON partner.effica_ssn = partner_row.person
LEFT JOIN ${migrationSchema:name}.paydecisionrows family_size_row ON family_size_row.rowtype = 3
    AND family_size_row.internalid = pd.internaldecisionnumber
WHERE EXISTS (SELECT 1 FROM ${migrationSchema:name}.paydecisionrows pdr WHERE pdr.internalid = pd.internaldecisionnumber) AND (
    $(statusMappings:json)::jsonb ->> pd.status::text IS NOT NULL OR -- include all known status types
    pd.status::text NOT IN ($(allStatuses:csv)) -- include all unknown status codes
);

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_fee_decision_todo CASCADE;

CREATE TABLE ${migrationSchema:name}.evaka_fee_decision_todo AS
SELECT *, 'STATUS MISSING' AS reason
FROM ${migrationSchema:name}.evaka_fee_decision
WHERE status IS NULL;

INSERT INTO ${migrationSchema:name}.evaka_fee_decision_todo
SELECT *, 'START AFTER END'
FROM ${migrationSchema:name}.evaka_fee_decision
WHERE start_date > end_date;

INSERT INTO ${migrationSchema:name}.evaka_fee_decision_todo
SELECT DISTINCT fd1.*, 'OVERLAPPING FEE DECISION'
FROM ${migrationSchema:name}.evaka_fee_decision fd1
JOIN ${migrationSchema:name}.evaka_fee_decision fd2 ON fd1.effica_ssn = fd2.effica_ssn
    AND fd1.status_group = fd2.status_group
    AND fd1.effica_internal_decision_number != fd2.effica_internal_decision_number
    AND (fd1.end_date >= fd1.start_date OR fd1.end_date IS NULL)
    AND (fd2.end_date >= fd2.start_date OR fd2.end_date IS NULL)
    AND daterange(fd1.start_date, fd1.end_date, '[]') && daterange(fd2.start_date, fd2.end_date, '[]');

INSERT INTO ${migrationSchema:name}.evaka_fee_decision_todo
SELECT *, 'PERSON MISSING'
FROM ${migrationSchema:name}.evaka_fee_decision
WHERE head_of_family_id IS NULL;

INSERT INTO ${migrationSchema:name}.evaka_fee_decision_todo
SELECT *, 'FAMILY SIZE MISSING'
FROM ${migrationSchema:name}.evaka_fee_decision
WHERE family_size IS NULL;

DELETE FROM ${migrationSchema:name}.evaka_fee_decision
WHERE id IN (SELECT id FROM ${migrationSchema:name}.evaka_fee_decision_todo);

-- pay decision row -> fee decision child

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_fee_decision_child CASCADE;
CREATE TABLE ${migrationSchema:name}.evaka_fee_decision_child (
    id UUID PRIMARY KEY DEFAULT ${extensionSchema:name}.uuid_generate_v1mc(),
    effica_paydecisionrows_guid TEXT,
    fee_decision_id UUID REFERENCES ${migrationSchema:name}.evaka_fee_decision,
    child_id UUID REFERENCES ${migrationSchema:name}.evaka_person,
    child_date_of_birth DATE,
    sibling_discount INTEGER NOT NULL,
    placement_unit_id UUID REFERENCES ${migrationSchema:name}.evaka_daycare,
    service_need_option_id UUID,
    base_fee INTEGER NOT NULL,
    fee INTEGER NOT NULL,
    final_fee INTEGER NOT NULL,
    effica_internal_decision_number INTEGER,
    effica_ssn TEXT
);

INSERT INTO ${migrationSchema:name}.evaka_fee_decision_child
    (effica_paydecisionrows_guid, fee_decision_id, child_id, child_date_of_birth, sibling_discount, placement_unit_id, service_need_option_id, base_fee, fee, final_fee, effica_internal_decision_number, effica_ssn)
SELECT
    pdr.guid,
    efd.id,
    child.id,
    child.date_of_birth,
    0, -- TODO: sibling discount
    ep.unit_id,
    esn.option_id,
    pdr.fee * 100,
    pdr.fee * 100,
    pdr.fee * 100,
    pd.internaldecisionnumber,
    child.effica_ssn
FROM ${migrationSchema:name}.paydecisionrows pdr
JOIN ${migrationSchema:name}.paydecisions pd ON pd.internaldecisionnumber = pdr.internalid
JOIN ${migrationSchema:name}.evaka_fee_decision efd ON efd.effica_internal_decision_number = pd.internaldecisionnumber
LEFT JOIN ${migrationSchema:name}.evaka_person child ON child.effica_ssn = pdr.person
LEFT JOIN ${migrationSchema:name}.evaka_placement ep ON ep.child_id = child.id
    AND daterange(ep.start_date, ep.end_date) @> efd.start_date
LEFT JOIN ${migrationSchema:name}.evaka_service_need esn ON esn.placement_id = ep.id
    AND daterange(esn.start_date, esn.end_date) @> efd.start_date
WHERE pdr.rowtype = 5;

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_fee_decision_child_todo;

CREATE TABLE ${migrationSchema:name}.evaka_fee_decision_child_todo AS
SELECT *, 'PERSON MISSING' AS reason
FROM ${migrationSchema:name}.evaka_fee_decision_child
WHERE child_id IS NULL;

INSERT INTO ${migrationSchema:name}.evaka_fee_decision_child_todo
SELECT *, 'PLACEMENT MISSING'
FROM ${migrationSchema:name}.evaka_fee_decision_child
WHERE placement_unit_id IS NULL;

INSERT INTO ${migrationSchema:name}.evaka_fee_decision_child_todo
SELECT *, 'SERVICE NEED OPTION MISSING'
FROM ${migrationSchema:name}.evaka_fee_decision_child
WHERE service_need_option_id IS NULL;

DELETE FROM ${migrationSchema:name}.evaka_fee_decision_child
WHERE id IN (SELECT id FROM ${migrationSchema:name}.evaka_fee_decision_child_todo);

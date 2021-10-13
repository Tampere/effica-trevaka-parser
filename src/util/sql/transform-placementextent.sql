-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_service_need CASCADE;
CREATE TABLE ${migrationSchema:name}.evaka_service_need (
    id UUID PRIMARY KEY DEFAULT ${extensionSchema:name}.uuid_generate_v1mc(),
    effica_placement_nbr INTEGER NOT NULL,
    effica_extent_nbr INTEGER NOT NULL,
    effica_extent_code TEXT NOT NULL,
    option_id UUID,
    placement_id UUID NOT NULL REFERENCES ${migrationSchema:name}.evaka_placement,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    UNIQUE (effica_placement_nbr, effica_extent_nbr)
);

INSERT INTO ${migrationSchema:name}.evaka_service_need
    (effica_placement_nbr, effica_extent_nbr, effica_extent_code, option_id, placement_id, start_date, end_date)
SELECT
    pe.placementnbr,
    pe.extentnbr,
    pe.extentcode,
    em.evaka_id,
    ep.id,
    pe.startdate,
    COALESCE(pe.enddate, ep.end_date)
FROM ${migrationSchema:name}.placementextents pe
JOIN ${migrationSchema:name}.evaka_placement ep ON ep.effica_placement_nbr = pe.placementnbr
LEFT JOIN ${migrationSchema:name}.extentmap em ON em.effica_id = pe.extentcode AND em.days = pe.days;

-- delete duplicate rows
DELETE FROM ${migrationSchema:name}.evaka_service_need p1
USING ${migrationSchema:name}.evaka_service_need p2
WHERE p1.effica_placement_nbr = p2.effica_placement_nbr
AND p1.effica_extent_nbr > p2.effica_extent_nbr
AND p1.start_date = p2.start_date
AND (p1.end_date = p2.end_date OR p1.end_date IS NULL AND p2.end_date IS NULL)
AND p1.effica_extent_code = p2.effica_extent_code;

DROP TABLE IF EXISTS ${migrationSchema:name}.evaka_service_need_todo CASCADE;

-- insert missing service need options to todo table
CREATE TABLE ${migrationSchema:name}.evaka_service_need_todo AS
SELECT *, 'OPTION MISSING'
FROM ${migrationSchema:name}.evaka_service_need
WHERE option_id IS NULL;

-- remove problematic service needs from migration
DELETE FROM ${migrationSchema:name}.evaka_service_need
WHERE id IN (SELECT id FROM ${migrationSchema:name}.evaka_service_need_todo);

-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later


-- Fixes Effica's attempt to handle the death of a head of family by just flipping the partner's role to HOF without updating anything else
-- Restores the partner row with an enddate and creates a new HOF row for the partner starting from the role change
UPDATE ${migrationSchema:name}.families
SET
    roleinfamily = 'S',
    enddate = '2021-07-19'::date
WHERE guid = '{DFDECC50-FC1A-4150-BFFC-55EBFA98EC9A}';

INSERT INTO ${migrationSchema:name}.families (personid, familynbr, startdate, enddate, roleinfamily, guid)
SELECT
    personid,
    familynbr,
    '2021-07-20'::date,
    null,
    'R',
    null -- no Effica row id for post import inserts
FROM ${migrationSchema:name}.families
WHERE guid = '{DFDECC50-FC1A-4150-BFFC-55EBFA98EC9A}';

-- Removes an errant one day family role that conflicts with valid data (this should be done with an exclusion instead)
DELETE FROM ${migrationSchema:name}.families where guid = '{713E11F3-F2E9-4ADA-85CA-FBF17AC8699C}';
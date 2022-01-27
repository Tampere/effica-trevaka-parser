-- SPDX-FileCopyrightText: 2021-2022 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

SELECT x.*
FROM migration.evaka_placement_todo x
WHERE x.reason = 'UNIT MISSING' AND
    (
        x.effica_unit_id NOT IN (SELECT effica_id FROM migration.unwantedunits) OR
        x.effica_childminder_id NOT IN (SELECT effica_id FROM migration.childmindermap)
    );

-- SPDX-FileCopyrightText: 2023-2024 Tampere region
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP TABLE IF EXISTS $(migrationSchema:name).evaka_daycare_group;

CREATE TABLE $(migrationSchema:name).evaka_daycare_group
(
    id               UUID PRIMARY KEY DEFAULT $(extensionSchema:name).uuid_generate_v1mc(),
    daycare_id       UUID,
    name             TEXT NOT NULL,
    start_date       DATE NOT NULL,
    end_date         DATE,
    caretaker_amount NUMERIC
);

INSERT INTO $(migrationSchema:name).evaka_daycare_group (daycare_id, name, start_date, end_date, caretaker_amount)
SELECT daycare.id,
       effica_department.avdnamn,
       coalesce(effica_department.avdfdat::date, daycare.opening_date),
       coalesce(effica_department.avdtdat::date, daycare.closing_date),
       ceil(effica_department.avdplatser::numeric / 7)::integer
FROM $(migrationSchema:name).effica_department
         LEFT JOIN daycare ON daycare.name = effica_department.avdenhet OR
                              daycare.name = $(unitMapping)::jsonb ->> effica_department.avdenhet;

-- SPDX-FileCopyrightText: 2023-2024 Tampere region
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP TABLE IF EXISTS $(migrationSchema:name).evaka_fridge_partner;
DROP TABLE IF EXISTS $(migrationSchema:name).evaka_fridge_child;

CREATE TABLE $(migrationSchema:name).evaka_fridge_child
(
    child_id      UUID,
    head_of_child UUID,
    start_date    DATE,
    end_date      DATE
);

CREATE TABLE $(migrationSchema:name).evaka_fridge_partner
(
    partnership_id UUID,
    indx           SMALLINT,
    person_id      UUID,
    start_date     DATE,
    end_date       DATE,
    conflict       BOOLEAN,
    other_indx     SMALLINT
);

INSERT INTO $(migrationSchema:name).evaka_fridge_child (child_id, head_of_child, start_date, end_date)
SELECT evaka_child.id,
       evaka_head_of_child.id,
       coalesce(effica_fridge_child.period::date, evaka_child.date_of_birth),
       coalesce(effica_fridge_child.period::date, evaka_child.date_of_birth + interval '18 years' - interval '1 day')
FROM $(migrationSchema:name).effica_fridge_child
         LEFT JOIN $(migrationSchema:name).evaka_person evaka_child
                   ON evaka_child.effica_ssn = effica_fridge_child.personnr
         LEFT JOIN $(migrationSchema:name).evaka_person evaka_head_of_child
                   ON evaka_head_of_child.effica_ssn = effica_fridge_child.regledare;

WITH adults AS (SELECT evaka_person.id
                FROM $(migrationSchema:name).effica_fridge_child
                         JOIN $(migrationSchema:name).evaka_person
                              ON evaka_person.effica_ssn = effica_fridge_child.regledare
                UNION
                SELECT evaka_person.id
                FROM $(migrationSchema:name).effica_income
                         JOIN $(migrationSchema:name).evaka_person ON evaka_person.effica_ssn = effica_income.reglpnr
                UNION
                SELECT evaka_person.id
                FROM $(migrationSchema:name).effica_income
                         JOIN $(migrationSchema:name).evaka_person
                              ON evaka_person.effica_ssn = effica_income.samhorpnr),
     partners AS (SELECT $(extensionSchema:name).uuid_generate_v1mc() AS partnership_id,
                         person1.id                                   AS person1_id,
                         person2.id                                   AS person2_id
                  FROM person person1
                           JOIN person person2 ON person1.id <> person2.id
                      AND person1.id < person2.id
                      AND NOT person1.restricted_details_enabled
                      AND NOT person2.restricted_details_enabled
                      AND trim(person1.residence_code) <> ''
                      AND trim(person2.residence_code) <> ''
                      AND person1.residence_code = person2.residence_code
                  WHERE person1.id IN (SELECT id FROM adults)
                    AND person2.id IN (SELECT id FROM adults))
INSERT
INTO $(migrationSchema:name).evaka_fridge_partner (partnership_id,
                                                   indx,
                                                   person_id,
                                                   start_date,
                                                   end_date,
                                                   conflict,
                                                   other_indx)
SELECT partnership_id,
       1,
       person1_id,
       current_date,
       NULL::date,
       (SELECT count(*)
        FROM partners conflicting
        WHERE conflicting.person1_id = p1.person1_id
           OR conflicting.person2_id = p1.person2_id) <> 1,
       2
FROM partners p1
UNION
SELECT partnership_id,
       2,
       person2_id,
       current_date,
       NULL::date,
       (SELECT count(*)
        FROM partners conflicting
        WHERE conflicting.person1_id = p2.person1_id
           OR conflicting.person2_id = p2.person2_id) <> 1,
       1
FROM partners p2;

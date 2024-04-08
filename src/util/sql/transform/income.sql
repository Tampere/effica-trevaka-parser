-- SPDX-FileCopyrightText: 2023-2024 Tampere region
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP TABLE IF EXISTS $(migrationSchema:name).evaka_income;

CREATE TABLE $(migrationSchema:name).evaka_income
(
    id              UUID PRIMARY KEY DEFAULT $(extensionSchema:name).uuid_generate_v1mc(),
    person_id       UUID,
    data            JSONB   NOT NULL,
    valid_from      DATE,
    valid_to        DATE,
    notes           TEXT    NOT NULL,
    effect          TEXT,
    is_entrepreneur BOOLEAN NOT NULL,
    works_at_echa   BOOLEAN NOT NULL
);

WITH effica_income_union AS (SELECT reglpnr                           AS social_security_number,
                                    (reglink::numeric * 100)::integer AS amount,
                                    reglidatfr                        AS valid_from,
                                    reglidatto                        AS valid_to,
                                    reglsaknas = 'X'                  AS incomplete,
                                    reglmax = 'X'                     AS max_fee_accepted,
                                    'MONTHLY_NO_HOLIDAY_BONUS'        AS coefficient,
                                    1                                 AS multiplier
                             FROM $(migrationSchema:name).effica_income
                             WHERE effica_income.reglpnr IS NOT NULL
                               AND effica_income.reglink IS NOT NULL
                             UNION
                             SELECT samhorpnr                         AS social_security_number,
                                    (samhink::numeric * 100)::integer AS amount,
                                    samhidatfr                        AS valid_from,
                                    samhidatto                        AS valid_to,
                                    samhsaknas = 'X'                  AS incomplete,
                                    samhmax = 'X'                     AS max_fee_accepted,
                                    'MONTHLY_NO_HOLIDAY_BONUS'        AS coefficient,
                                    1                                 AS multiplier
                             FROM $(migrationSchema:name).effica_income
                             WHERE effica_income.samhorpnr IS NOT NULL
                               AND effica_income.samhink IS NOT NULL)
INSERT
INTO $(migrationSchema:name).evaka_income (person_id, data, valid_from, valid_to, notes, effect, is_entrepreneur,
                                           works_at_echa)
SELECT evaka_person.id,
       CASE
           WHEN effica_income_union.max_fee_accepted THEN '{}'::jsonb
           WHEN effica_income_union.incomplete THEN '{}'::jsonb
           ELSE jsonb_build_object('MAIN_INCOME', jsonb_build_object('amount', amount,
                                                                     'coefficient', coefficient,
                                                                     'multiplier', multiplier,
                                                                     'monthlyAmount', amount * multiplier))
           END,
       effica_income_union.valid_from::date,
       effica_income_union.valid_to::date,
       'Tulojen summa Efficasta',
       CASE
           WHEN effica_income_union.max_fee_accepted THEN 'MAX_FEE_ACCEPTED'
           WHEN effica_income_union.incomplete THEN 'INCOMPLETE'
           ELSE 'INCOME'
           END,
       FALSE,
       FALSE
FROM effica_income_union
         LEFT JOIN $(migrationSchema:name).evaka_person
                   ON evaka_person.effica_ssn = effica_income_union.social_security_number;

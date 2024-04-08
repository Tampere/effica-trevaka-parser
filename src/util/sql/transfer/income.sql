-- SPDX-FileCopyrightText: 2023-2024 Tampere region
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

INSERT INTO income (id, person_id, data, valid_from, valid_to, notes, effect, is_entrepreneur, works_at_echa,
                    updated_at, updated_by)
SELECT id,
       person_id,
       data,
       valid_from,
       valid_to,
       notes,
       effect::income_effect,
       is_entrepreneur,
       works_at_echa,
       $(updatedAt),
       $(updatedBy)
FROM $(migrationSchema:name).evaka_income;

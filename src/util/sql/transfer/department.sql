-- SPDX-FileCopyrightText: 2023-2024 Tampere region
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

INSERT INTO daycare_group (id, daycare_id, name, start_date, end_date)
SELECT id, daycare_id, name, start_date, end_date
FROM $(migrationSchema:name).evaka_daycare_group;

INSERT INTO daycare_caretaker (group_id, amount, start_date, end_date)
SELECT id, caretaker_amount, start_date, end_date
FROM $(migrationSchema:name).evaka_daycare_group
WHERE caretaker_amount IS NOT NULL;

INSERT INTO message_account (daycare_group_id, type)
SELECT id, 'GROUP'
FROM daycare_group
ON CONFLICT DO NOTHING;

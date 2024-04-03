-- SPDX-FileCopyrightText: 2023-2024 Tampere region
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

INSERT INTO child (id)
SELECT DISTINCT placement_child_id
FROM $(migrationSchema:name).evaka_placement_valid
ON CONFLICT DO NOTHING;

INSERT INTO placement (id, type, child_id, unit_id, start_date, end_date, place_guarantee)
SELECT placement_id,
       placement_type::placement_type,
       placement_child_id,
       placement_unit_id,
       placement_start_date,
       placement_end_date,
       placement_place_guarantee
FROM $(migrationSchema:name).evaka_placement_valid;

INSERT INTO service_need (id, option_id, placement_id, start_date, end_date, shift_care)
SELECT service_need_id,
       service_need_option_id,
       placement_id,
       service_need_start_date,
       service_need_end_date,
       service_need_shift_care::shift_care_type
FROM $(migrationSchema:name).evaka_placement_valid
WHERE service_need_option_id IS NOT NULL;

INSERT INTO daycare_group_placement (id, daycare_placement_id, daycare_group_id, start_date, end_date)
SELECT group_placement_id,
       placement_id,
       group_placement_daycare_group_id,
       placement_start_date,
       placement_end_date
FROM $(migrationSchema:name).evaka_placement_valid;

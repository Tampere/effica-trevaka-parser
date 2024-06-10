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

INSERT INTO service_need (id, option_id, placement_id, start_date, end_date, shift_care, part_week)
SELECT service_need_id,
       service_need_option_id,
       placement_id,
       service_need_start_date,
       service_need_end_date,
       service_need_shift_care::shift_care_type,
       service_need_part_week
FROM $(migrationSchema:name).evaka_placement_valid
WHERE service_need_option_id IS NOT NULL;

INSERT INTO daycare_group_placement (id, daycare_placement_id, daycare_group_id, start_date, end_date)
SELECT group_placement_id,
       placement_id,
       group_placement_daycare_group_id,
       placement_start_date,
       placement_end_date
FROM $(migrationSchema:name).evaka_placement_valid;

-- fix missing service needs
WITH extended_service_needs AS (SELECT service_need.*,
                                       daterange(placement.start_date, placement.end_date, '[]') -
                                       daterange(service_need.start_date, service_need.end_date, '[]') AS range
                                FROM placement
                                         JOIN service_need ON service_need.placement_id = placement.id)
INSERT
INTO service_need (option_id, placement_id, start_date, end_date, confirmed_by, confirmed_at, shift_care, part_week)
SELECT option_id, placement_id, lower(range), upper(range) - interval '1 day', confirmed_by, confirmed_at, shift_care, part_week
FROM extended_service_needs
WHERE NOT isempty(range);

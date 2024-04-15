-- SPDX-FileCopyrightText: 2023-2024 Tampere region
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP VIEW IF EXISTS $(migrationSchema:name).evaka_placement_valid;
DROP TABLE IF EXISTS $(migrationSchema:name).evaka_placement;

CREATE TABLE $(migrationSchema:name).evaka_placement
(
    effica_ssn                       TEXT,
    -- placement
    placement_id                     UUID PRIMARY KEY DEFAULT $(extensionSchema:name).uuid_generate_v1mc(),
    placement_type                   TEXT,
    placement_child_id               UUID,
    placement_unit_id                UUID,
    placement_start_date             DATE,
    placement_end_date               DATE,
    placement_place_guarantee        BOOLEAN,
    -- service_need
    service_need_id                  UUID             DEFAULT $(extensionSchema:name).uuid_generate_v1mc(),
    service_need_option_id           UUID,
    service_need_start_date          DATE,
    service_need_end_date            DATE,
    service_need_shift_care          TEXT,
    -- daycare_group_placement
    group_placement_id               UUID             DEFAULT $(extensionSchema:name).uuid_generate_v1mc(),
    group_placement_daycare_group_id UUID
);

CREATE VIEW $(migrationSchema:name).evaka_placement_valid AS
SELECT *
FROM $(migrationSchema:name).evaka_placement
WHERE placement_type IS NOT NULL
  AND placement_child_id IS NOT NULL
  AND placement_unit_id IS NOT NULL
  AND placement_start_date IS NOT NULL
  AND placement_end_date IS NOT NULL
  AND group_placement_id IS NOT NULL;

INSERT INTO $(migrationSchema:name).evaka_placement (effica_ssn,
                                                     placement_type,
                                                     placement_child_id,
                                                     placement_unit_id,
                                                     placement_start_date,
                                                     placement_end_date,
                                                     placement_place_guarantee,
                                                     service_need_option_id,
                                                     service_need_start_date,
                                                     service_need_end_date,
                                                     service_need_shift_care,
                                                     group_placement_daycare_group_id)
SELECT effica_placement.barnpnr,
       coalesce(option_by_provider_type.valid_placement_type, option_by_id.valid_placement_type),
       evaka_person.id,
       coalesce(unit_by_mapping.id, unit_by_name.id),
       effica_placement.placfrom::date,
       effica_placement.plactom::date,
       FALSE,
       CASE coalesce(option_by_provider_type.default_option, option_by_id.default_option)
           WHEN TRUE THEN NULL
           WHEN FALSE THEN coalesce(option_by_provider_type.id, option_by_id.id)
           END,
       coalesce(effica_placement.timmarfrom::date, effica_placement.placfrom::date),
       coalesce(effica_placement.timmartom::date, effica_placement.plactom::date),
       CASE WHEN effica_placement.omfattning ILIKE '%vuorohoito%' THEN 'FULL' ELSE 'NONE' END,
       evaka_daycare_group_valid.id
FROM $(migrationSchema:name).effica_placement
         LEFT JOIN $(migrationSchema:name).evaka_person ON evaka_person.effica_ssn = effica_placement.barnpnr
         LEFT JOIN daycare unit_by_mapping ON unit_by_mapping.name = $(unitMapping)::jsonb ->> effica_placement.enhet
         LEFT JOIN daycare unit_by_name ON unit_by_name.name = effica_placement.enhet
         LEFT JOIN service_need_option option_by_id
                   ON option_by_id.id::text =
                      $(placementMapping)::jsonb -> effica_placement.omfattning ->> 'serviceNeedOptionId'
         LEFT JOIN service_need_option option_by_provider_type
                   ON coalesce(unit_by_mapping.provider_type, unit_by_name.provider_type) =
                      'PRIVATE_SERVICE_VOUCHER' AND option_by_provider_type.id::text =
                                                    $(placementMapping)::jsonb -> effica_placement.omfattning ->>
                                                    'privateServiceVoucherServiceNeedOptionId'
         LEFT JOIN $(migrationSchema:name).evaka_daycare_group_valid
                   ON evaka_daycare_group_valid.daycare_id = coalesce(unit_by_mapping.id, unit_by_name.id) AND
                      evaka_daycare_group_valid.name = effica_placement.avdelning;

-- transform overlapping PRESCHOOL and PRESCHOOL_DAYCARE_ONLY to PRESCHOOL_DAYCARE
WITH overlapping AS (SELECT preschool.effica_ssn,
                            preschool.placement_child_id,
                            -- PRESCHOOL_DAYCARE
                            daterange(preschool.placement_start_date, preschool.placement_end_date, '[]') *
                            daterange(daycare.placement_start_date, daycare.placement_end_date,
                                      '[]')                            AS preschool_daycare_placement_range,
                            -- PRESCHOOL
                            daterange(preschool.placement_start_date, preschool.placement_end_date,
                                      '[]')::datemultirange -
                            daterange(daycare.placement_start_date, daycare.placement_end_date,
                                      '[]')::datemultirange            AS preschool_placement_ranges,
                            preschool.placement_id                     AS preschool_placement_id,
                            preschool.placement_type                   AS preschool_placement_type,
                            preschool.placement_unit_id                AS preschool_placement_unit_id,
                            preschool.placement_place_guarantee        AS preschool_placement_place_guarantee,
                            preschool.service_need_option_id           AS preschool_service_need_option_id,
                            daterange(preschool.service_need_start_date, preschool.service_need_end_date,
                                      '[]')                            AS preschool_service_need_range,
                            preschool.service_need_shift_care          AS preschool_service_need_shift_care,
                            preschool.group_placement_daycare_group_id AS preschool_group_placement_daycare_group_id,
                            -- PRESCHOOL_DAYCARE_ONLY
                            daterange(daycare.placement_start_date, daycare.placement_end_date, '[]')::datemultirange -
                            daterange(preschool.placement_start_date, preschool.placement_end_date,
                                      '[]')::datemultirange            AS daycare_placement_ranges,
                            daycare.placement_id                       AS daycare_placement_id,
                            daycare.placement_type                     AS daycare_placement_type,
                            daycare.placement_unit_id                  AS daycare_placement_unit_id,
                            daycare.placement_place_guarantee          AS daycare_placement_place_guarantee,
                            daycare.service_need_option_id             AS daycare_service_need_option_id,
                            daterange(daycare.service_need_start_date, daycare.service_need_end_date,
                                      '[]')                            AS daycare_service_need_range,
                            daycare.service_need_shift_care            AS daycare_service_need_shift_care,
                            daycare.group_placement_daycare_group_id   AS daycare_group_placement_daycare_group_id
                     FROM $(migrationSchema:name).evaka_placement preschool
                              JOIN $(migrationSchema:name).evaka_placement daycare
                                   ON preschool.placement_child_id = daycare.placement_child_id AND
                                      preschool.placement_type = 'PRESCHOOL' AND
                                      daycare.placement_type = 'PRESCHOOL_DAYCARE_ONLY' AND
                                      daterange(preschool.placement_start_date, preschool.placement_end_date, '[]') &&
                                      daterange(daycare.placement_start_date, daycare.placement_end_date, '[]')),
     overlapping_delete AS (
         DELETE FROM $(migrationSchema:name).evaka_placement
             USING overlapping
             WHERE placement_id = overlapping.preschool_placement_id OR
                   placement_id = overlapping.daycare_placement_id),
     preschool_daycare_insert AS (
         INSERT INTO $(migrationSchema:name).evaka_placement (effica_ssn,
                                                              placement_type,
                                                              placement_child_id,
                                                              placement_unit_id,
                                                              placement_start_date,
                                                              placement_end_date,
                                                              placement_place_guarantee,
                                                              service_need_option_id,
                                                              service_need_start_date,
                                                              service_need_end_date,
                                                              service_need_shift_care,
                                                              group_placement_daycare_group_id)
             SELECT effica_ssn,
                    'PRESCHOOL_DAYCARE',
                    placement_child_id,
                    daycare_placement_unit_id,
                    lower(preschool_daycare_placement_range),
                    upper(preschool_daycare_placement_range) - interval '1 day',
                    daycare_placement_place_guarantee,
                    coalesce(correct_option.id, service_need_option.id),
                    lower(daycare_service_need_range * preschool_daycare_placement_range),
                    upper(daycare_service_need_range * preschool_daycare_placement_range) -
                    interval '1 day',
                    daycare_service_need_shift_care,
                    daycare_group_placement_daycare_group_id
             FROM overlapping
                      LEFT JOIN service_need_option ON service_need_option.id = daycare_service_need_option_id
                      LEFT JOIN service_need_option correct_option
                                ON correct_option.name_fi = service_need_option.name_fi AND
                                   NOT correct_option.default_option AND
                                   correct_option.valid_placement_type = 'PRESCHOOL_DAYCARE'),
     preschool_select AS (SELECT effica_ssn,
                                 placement_child_id,
                                 preschool_placement_type,
                                 preschool_placement_unit_id,
                                 unnest(preschool_placement_ranges) AS preschool_range,
                                 preschool_placement_place_guarantee,
                                 preschool_service_need_option_id,
                                 preschool_service_need_range,
                                 preschool_service_need_shift_care,
                                 preschool_group_placement_daycare_group_id
                          FROM overlapping),
     preschool_insert AS (
         INSERT INTO $(migrationSchema:name).evaka_placement (effica_ssn,
                                                              placement_type,
                                                              placement_child_id,
                                                              placement_unit_id,
                                                              placement_start_date,
                                                              placement_end_date,
                                                              placement_place_guarantee,
                                                              service_need_option_id,
                                                              service_need_start_date,
                                                              service_need_end_date,
                                                              service_need_shift_care,
                                                              group_placement_daycare_group_id)
             SELECT effica_ssn,
                    preschool_placement_type,
                    placement_child_id,
                    preschool_placement_unit_id,
                    lower(preschool_range),
                    upper(preschool_range) - interval '1 day',
                    preschool_placement_place_guarantee,
                    preschool_service_need_option_id,
                    lower(preschool_service_need_range * preschool_range),
                    upper(preschool_service_need_range * preschool_range) - interval '1 day',
                    preschool_service_need_shift_care,
                    preschool_group_placement_daycare_group_id
             FROM preschool_select),
     daycare_select AS (SELECT effica_ssn,
                               placement_child_id,
                               daycare_placement_type,
                               daycare_placement_unit_id,
                               unnest(daycare_placement_ranges) AS daycare_range,
                               daycare_placement_place_guarantee,
                               daycare_service_need_option_id,
                               daycare_service_need_range,
                               daycare_service_need_shift_care,
                               daycare_group_placement_daycare_group_id
                        FROM overlapping),
     daycare_insert AS (
         INSERT INTO $(migrationSchema:name).evaka_placement (effica_ssn,
                                                              placement_type,
                                                              placement_child_id,
                                                              placement_unit_id,
                                                              placement_start_date,
                                                              placement_end_date,
                                                              placement_place_guarantee,
                                                              service_need_option_id,
                                                              service_need_start_date,
                                                              service_need_end_date,
                                                              service_need_shift_care,
                                                              group_placement_daycare_group_id)
             SELECT effica_ssn,
                    daycare_placement_type,
                    placement_child_id,
                    daycare_placement_unit_id,
                    lower(daycare_range),
                    upper(daycare_range) - interval '1 day',
                    daycare_placement_place_guarantee,
                    daycare_service_need_option_id,
                    lower(daycare_service_need_range * daycare_range),
                    upper(daycare_service_need_range * daycare_range) - interval '1 day',
                    daycare_service_need_shift_care,
                    daycare_group_placement_daycare_group_id
             FROM daycare_select)
SELECT *
FROM overlapping;

-- fix null end dates from next start dates
WITH data1 AS (SELECT *
               FROM $(migrationSchema:name).evaka_placement
               WHERE placement_end_date IS NULL),
     data2 AS (SELECT data1.placement_id, MIN(data2.placement_start_date) - INTERVAL '1 day' AS new_end_date
               FROM data1,
                    $(migrationSchema:name).evaka_placement data2
               WHERE data1.effica_ssn = data2.effica_ssn
                 AND data1.placement_id <> data2.placement_id
                 AND data2.placement_start_date > data1.placement_start_date
               GROUP BY data1.placement_id)
UPDATE $(migrationSchema:name).evaka_placement
SET placement_end_date = data2.new_end_date
FROM data2
WHERE $(migrationSchema:name).evaka_placement.placement_id = data2.placement_id;

-- fix null end dates based on placement type
UPDATE $(migrationSchema:name).evaka_placement
SET placement_end_date = (
    CASE placement_type
        WHEN 'DAYCARE'
            THEN $(migrationSchema:name).daycare_end_date(effica_ssn, placement_start_date)
        WHEN 'PRESCHOOL_DAYCARE'
            THEN $(migrationSchema:name).preschool_daycare_end_date(placement_start_date)
        WHEN 'PRESCHOOL_DAYCARE_ONLY'
            THEN $(migrationSchema:name).preschool_daycare_end_date(placement_start_date)
        END)
WHERE placement_end_date IS NULL;

-- fix service need range
WITH data1 AS (SELECT placement_id,
                      daterange(placement_start_date, placement_end_date, '[]')       AS placement_range,
                      daterange(service_need_start_date, service_need_end_date, '[]') AS service_need_range
               FROM $(migrationSchema:name).evaka_placement),
     data2 AS (SELECT placement_id, placement_range * service_need_range AS new_service_need_range
               FROM data1
               WHERE NOT placement_range @> service_need_range)
UPDATE $(migrationSchema:name).evaka_placement
SET service_need_start_date = lower(new_service_need_range),
    service_need_end_date   = upper(new_service_need_range) - interval '1 day'
FROM data2
WHERE evaka_placement.placement_id = data2.placement_id;

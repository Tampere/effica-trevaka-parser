-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

INSERT INTO fee_decision (
    id,
    status,
    valid_during,
    decision_type,
    head_of_family_id,
    head_of_family_income,
    partner_id,
    partner_income,
    family_size,
    fee_thresholds,
    decision_number
) SELECT
    efd.id,
    efd.status::fee_decision_status,
    daterange(efd.start_date, efd.end_date, '[]'),
    efd.decision_type::fee_decision_type,
    efd.head_of_family_id,
    efd.head_of_family_income,
    efd.partner_id,
    efd.partner_income,
    efd.family_size,
    CASE efd.family_size
        WHEN 2 THEN jsonb_build_object(
            'minIncomeThreshold', ft.min_income_threshold_2,
            'maxIncomeThreshold', ft.max_income_threshold_2,
            'incomeMultiplier', ft.income_multiplier_2,
            'maxFee', ft.max_fee,
            'minFee', ft.min_fee
        )
        WHEN 3 THEN jsonb_build_object(
            'minIncomeThreshold', ft.min_income_threshold_3,
            'maxIncomeThreshold', ft.max_income_threshold_3,
            'incomeMultiplier', ft.income_multiplier_3,
            'maxFee', ft.max_fee,
            'minFee', ft.min_fee
        )
        WHEN 4 THEN jsonb_build_object(
            'minIncomeThreshold', ft.min_income_threshold_4,
            'maxIncomeThreshold', ft.max_income_threshold_4,
            'incomeMultiplier', ft.income_multiplier_4,
            'maxFee', ft.max_fee,
            'minFee', ft.min_fee
        )
        WHEN 5 THEN jsonb_build_object(
            'minIncomeThreshold', ft.min_income_threshold_5,
            'maxIncomeThreshold', ft.max_income_threshold_5,
            'incomeMultiplier', ft.income_multiplier_5,
            'maxFee', ft.max_fee,
            'minFee', ft.min_fee
        )
        WHEN 6 THEN jsonb_build_object(
            'minIncomeThreshold', ft.min_income_threshold_6,
            'maxIncomeThreshold', ft.max_income_threshold_6,
            'incomeMultiplier', ft.income_multiplier_6,
            'maxFee', ft.max_fee,
            'minFee', ft.min_fee
        )
        ELSE jsonb_build_object(
            'minIncomeThreshold', ft.min_income_threshold_6 + ((efd.family_size - 6) * ft.income_threshold_increase_6_plus),
            'maxIncomeThreshold', ft.max_income_threshold_6 + ((efd.family_size - 6) * ft.income_threshold_increase_6_plus),
            'incomeMultiplier', ft.income_multiplier_6,
            'maxFee', ft.max_fee,
            'minFee', ft.min_fee
        )
    END,
    efd.decision_number
FROM ${migrationSchema:name}.evaka_fee_decision efd
LEFT JOIN fee_thresholds ft ON ft.valid_during @> efd.start_date;

INSERT INTO fee_decision_child (
    id,
    fee_decision_id,
    child_id,
    child_date_of_birth,
    sibling_discount,
    placement_unit_id,
    placement_type,
    service_need_fee_coefficient,
    service_need_description_fi,
    service_need_description_sv,
    service_need_contract_days_per_month,
    base_fee,
    fee,
    fee_alterations,
    final_fee
) SELECT
    efdc.id,
    efdc.fee_decision_id,
    efdc.child_id,
    efdc.child_date_of_birth,
    efdc.sibling_discount,
    efdc.placement_unit_id,
    sno.valid_placement_type,
    sno.fee_coefficient,
    sno.fee_description_fi,
    sno.fee_description_sv,
    sno.contract_days_per_month,
    (select max(faa1) * 100 from unnest(efdc.fee_and_deviations) faa1),
    (select max(faa2) * 100 from unnest(efdc.fee_and_deviations) faa2),
    COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
                'type', 'DISCOUNT',
                'amount', ABS(faa3),
                'isAbsolute', true,
                'effect', faa3 * 100
            )) FROM unnest(efdc.fee_and_deviations) faa3 WHERE faa3 < 0),
        '[]'
    ),
    (SELECT SUM(faa4) * 100 FROM unnest(efdc.fee_and_deviations) faa4)
FROM ${migrationSchema:name}.evaka_fee_decision_child efdc
JOIN service_need_option sno ON sno.id = efdc.service_need_option_id;

SELECT setval('fee_decision_number_sequence', (SELECT COALESCE(max(decision_number), 1) FROM fee_decision));

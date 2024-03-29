-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

INSERT INTO voucher_value_decision (
    id,
    status,
    valid_from,
    valid_to,
    decision_number,
    head_of_family_id,
    partner_id,
    family_size,
    fee_thresholds,
    approved_at,
    child_id,
    child_date_of_birth,
    base_co_payment,
    sibling_discount,
    placement_unit_id,
    placement_type,
    co_payment,
    fee_alterations,
    base_value,
    voucher_value,
    final_co_payment,
    service_need_fee_coefficient,
    service_need_voucher_value_coefficient,
    service_need_fee_description_fi,
    service_need_fee_description_sv,
    service_need_voucher_value_description_fi,
    service_need_voucher_value_description_sv,
    assistance_need_coefficient,
    difference,
    service_need_missing
) SELECT
    vvd.id,
    vvd.status::voucher_value_decision_status,
    vvd.valid_from,
    vvd.valid_to,
    vvd.decision_number,
    vvd.head_of_family_id,
    vvd.partner_id,
    vvd.family_size,
    CASE vvd.family_size
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
            'minIncomeThreshold', ft.min_income_threshold_6 + ((vvd.family_size - 6) * ft.income_threshold_increase_6_plus),
            'maxIncomeThreshold', ft.max_income_threshold_6 + ((vvd.family_size - 6) * ft.income_threshold_increase_6_plus),
            'incomeMultiplier', ft.income_multiplier_6,
            'maxFee', ft.max_fee,
            'minFee', ft.min_fee
        )
    END,
    vvd.effica_decision_date,
    vvd.child_id,
    vvd.child_date_of_birth,
    vvd.base_co_payment,
    vvd.sibling_discount,
    vvd.placement_unit_id,
    sno.valid_placement_type,
    vvd.co_payment,
    '[]', -- fee alterations
    CASE
        WHEN age(vvd.valid_from, vvd.child_date_of_birth) < interval '3 years' THEN vv.base_value_under_3y
        ELSE vv.base_value
    END,
    vvd.voucher_value,
    vvd.final_co_payment,
    sno.fee_coefficient,
    CASE
        WHEN age(vvd.valid_from, vvd.child_date_of_birth) < interval '3 years' THEN vv.coefficient_under_3y
        ELSE vv.coefficient
    END,
    sno.fee_description_fi,
    sno.fee_description_sv,
    sno.voucher_value_description_fi,
    sno.voucher_value_description_sv,
    vvd.capacity_factor,
    '{}',
    sno.id IS NULL
FROM ${migrationSchema:name}.evaka_voucher_value_decision vvd
LEFT JOIN fee_thresholds ft ON ft.valid_during @> vvd.valid_from
LEFT JOIN service_need_option sno ON sno.id = vvd.service_need_option_id
LEFT JOIN service_need_option_voucher_value vv ON vv.service_need_option_id = sno.id AND vv.validity @> vvd.valid_from
GROUP BY vvd.id, ft.id, sno.id, vv.id;

SELECT setval('voucher_value_decision_number_sequence', (SELECT COALESCE(max(decision_number), 1) FROM voucher_value_decision));

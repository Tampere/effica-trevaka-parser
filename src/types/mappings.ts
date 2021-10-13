// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

export type ApplicationStatusType =
    | "CREATED"
    | "SENT"
    | "WAITING_PLACEMENT"
    | "WAITING_UNIT_CONFIRMATION"
    | "WAITING_DECISION"
    | "WAITING_MAILING"
    | "WAITING_CONFIRMATION"
    | "REJECTED"
    | "ACTIVE"
    | "CANCELLED";
export type CitySpecificApplicationStatusMapping = Record<
    number,
    ApplicationStatusType
>;
export type CitySpecificApplicationStatusMappings = Record<
    string,
    CitySpecificApplicationStatusMapping
>;

export type FeeAlterationType = "DISCOUNT" | "INCREASE" | "RELIEF";
export type CitySpecificDeviationTypeMapping = Record<
    number,
    { type: FeeAlterationType; notes: string }
>;
export type CitySpecificDeviationTypeMappings = Record<
    string,
    CitySpecificDeviationTypeMapping
>;

export type EfficaIncomeCodeMapping = {
    codes: number[],
    evakaType: string,
    sign?: string
}

export type CitySpecificIncomeMapping = {
    coefficientMap: Record<string, string>
    incomeTypeMap: EfficaIncomeCodeMapping[]
    incomePeriodMap: EfficaIncomeCodeMapping[]
}

export type CitySpecificIncomeMappings = Record<string, CitySpecificIncomeMapping>
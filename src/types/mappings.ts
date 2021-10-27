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

export type DecisionStatusType =
    | "DRAFT"
    | "WAITING_FOR_SENDING"
    | "WAITING_FOR_MANUAL_SENDING"
    | "SENT"
    | "ANNULLED";

export type CitySpecificDailyJournalReportCodeMappings = Record<
    string,
    Record<number, { absenceType?: string; backupCare?: boolean }>
>;

export type AbsenceType =
    | "OTHER_ABSENCE"
    | "SICKLEAVE"
    | "UNKNOWN_ABSENCE"
    | "PLANNED_ABSENCE"
    | "TEMPORARY_RELOCATION"
    | "TEMPORARY_VISITOR"
    | "PARENTLEAVE"
    | "FORCE_MAJEURE";

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
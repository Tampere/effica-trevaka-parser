// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

export type CitySpecificSpecialNeedMappings = Record<
    string,
    Record<number, string>
>;
export type CitySpecificSpecialMeanMappings = Record<
    string,
    Record<number, number>
>;

export type ApplicationType = "CLUB" | "DAYCARE" | "PRESCHOOL";
export type CitySpecificApplicationTypeMappings = Record<
    string,
    Record<number, ApplicationType | null>
>;

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

export type CitySpecificPayDecisionStatusMappings = Record<
    string,
    Record<number, FeeDecisionStatusType | null>
>;

export type FeeDecisionStatusType =
    | "DRAFT"
    | "WAITING_FOR_SENDING"
    | "WAITING_FOR_MANUAL_SENDING"
    | "SENT"
    | "ANNULLED";

export type CitySpecificDailyJournalReportCodeMappings = Record<
    string,
    Record<number, { absenceType?: AbsenceType; backupCare?: boolean }>
>;

export type AbsenceType =
    | "OTHER_ABSENCE"
    | "SICKLEAVE"
    | "UNKNOWN_ABSENCE"
    | "PLANNED_ABSENCE"
    | "PARENTLEAVE"
    | "FORCE_MAJEURE"
    | "FREE_ABSENCE";

export type EfficaIncomeCodeMapping = {
    codes: number[],
    evakaType: string,
    sign?: string
}

export type CitySpecificIncomeMapping = {
    coefficientMap: Record<string, string>
    incomeTypeMap: EfficaIncomeCodeMapping[]
    incomePeriodMap: EfficaIncomeCodeMapping[]
    feeDecisionIncomeType: string,
    ignoredIncomePeriodCodes: number[]
}

export type CitySpecificIncomeMappings = Record<string, CitySpecificIncomeMapping>
export type SelectionPeriod = { startDate: string, endDate: string }

export interface VardaUnitMappingRow {
    evaka_daycare_id: string
    varda_unit_id: number
    name: string | null
    is_closed: boolean
}

export type MappingComparison = {
    evakaId: string
    vardaId: number
    evakaName: string | null
    vardaName: string
    evakaIsClosed: boolean
    vardaIsClosed: boolean | null
}
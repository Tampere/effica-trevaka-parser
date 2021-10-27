// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
    CitySpecificApplicationStatusMappings,
    CitySpecificDailyJournalReportCodeMappings,
    CitySpecificDeviationTypeMappings,
    CitySpecificIncomeMappings,
    DecisionStatusType,
} from "../types/mappings";

export const APPLICATION_STATUS_MAPPINGS: CitySpecificApplicationStatusMappings = {
    tampere: {
        999962042: "SENT", // Saapunut
        // 999962043: "", // Poistettu
        // 999962044: "", // Ehdotus lähetetty
        // 999962045: "", // Ehdotus hyväksytty
        // 999962046: "", // Ehdotus hylätty
        // 999962047: "", // Käsitelty
        // 999962050: "", // Tiedot vanhentuneet
    },
};

export const DEVIATION_TYPE_MAPPINGS: CitySpecificDeviationTypeMappings = {
    tampere: {
        5: { type: "DISCOUNT", notes: "ALENNUS" },
        39: { type: "DISCOUNT", notes: "ALENNUS AP/IP" },
        41: { type: "DISCOUNT", notes: "MAKSUTON OSUUS" },
        48: { type: "RELIEF", notes: "ULKOKUNTALAINEN" },
    },
};

export const VOUCHER_VALUE_DECISION_TYPES: Record<string, number[]> = {
    tampere: [426],
};

export const DECISION_STATUS_TYPE_MAPPINGS: Record<
    string,
    Record<number, DecisionStatusType | null>
> = {
    tampere: {
        82: "DRAFT", // Valmisteilla
        // 493: Vanhentunut
        999420001: "SENT", // Hyväksytty
        // 999420002: "ANNULLED", // Mitätöity
    },
};

export const DAILYJOURNAL_REPORTCODE_MAPPINGS: CitySpecificDailyJournalReportCodeMappings = {
    tampere: {
        169: {
            // Sairaana (S)
            absenceType: "SICKLEAVE",
        },
        170: {
            // Kesäajan maksuton poissaolo
            // TODO: uusi poissaolotyyppi
        },
        171: {
            // Muu poissaolo (P)
            absenceType: "OTHER_ABSENCE",
        },
        172: {
            // Sopimuksen muk. poissaolo (E)
            absenceType: "PLANNED_ABSENCE",
        },
        173: {
            // Sopimuksen ylitys (Y)
            // TODO: läsnäolo
        },
        174: {
            // Hoidossa muualla (X)
            absenceType: "TEMPORARY_RELOCATION",
        },
        175: {
            // Kerhon poissaolo
            absenceType: "OTHER_ABSENCE",
        },
        176: {
            // Lapsi sijaishoitopaikassa (V)
            backupCare: true,
        },
        177: {
            // Hoitopäivä yli 13 tuntia (L)
            // TODO: läsnäolo
        },
        178: {
            // Hyvityspäivä (-)
            absenceType: "FORCE_MAJEURE",
        },
        409: {
            // Työntasausvp - Lapsi hoidossa
            absenceType: "TEMPORARY_RELOCATION",
        },
        410: {
            // Työntasausvp - Lapsi poissa
            absenceType: "FORCE_MAJEURE",
        },
        447: {
            // Ilmoittamaton päivystyksen poissaolo
            absenceType: "UNKNOWN_ABSENCE",
        },
        474: {
            // Vuorohoidon poissaolo
            absenceType: "OTHER_ABSENCE",
        },
    },
};

export const citySpecificIncomeMappings: CitySpecificIncomeMappings = {
    tampere: {
        //maps evaka income periods to coefficients used to normalize income to monthly levels
        coefficientMap: {
            MONTHLY_NO_HOLIDAY_BONUS: "1.0",
            MONTHLY_WITH_HOLIDAY_BONUS: "1.0417",
            BI_WEEKLY_WITH_HOLIDAY_BONUS: "2.2323",
            BI_WEEKLY_NO_HOLIDAY_BONUS: "2.1429",
            YEARLY: "0.0833",
            DAILY_ALLOWANCE_21_5: "21.5",
            DAILY_ALLOWANCE_25: "25.0"
        },

        //maps effica income type codes to evaka income types
        incomeTypeMap: [
            { codes: [84], evakaType: "PENSION" },
            { codes: [85], evakaType: "MAIN_INCOME" },
            { codes: [86], evakaType: "HOLIDAY_BONUS" },
            { codes: [87], evakaType: "ALIMONY" },
            { codes: [88], evakaType: "PAID_ALIMONY", sign: "-" },
            { codes: [108], evakaType: "OTHER_INCOME" },
            { codes: [109], evakaType: "DAILY_ALLOWANCE" },
            { codes: [110], evakaType: "BUSINESS_INCOME" },
            { codes: [164], evakaType: "ADJUSTED_DAILY_ALLOWANCE" },
            { codes: [275], evakaType: "PERKS" },
            { codes: [451], evakaType: "HOME_CARE_ALLOWANCE" },
            { codes: [452], evakaType: "RELATIVE_CARE_SUPPORT" },
            { codes: [453], evakaType: "STUDENT_INCOME" },
            { codes: [454], evakaType: "GRANT" },
            { codes: [455], evakaType: "STARTUP_GRANT" },
            { codes: [456], evakaType: "CAPITAL_INCOME" },
            { codes: [457], evakaType: "RENTAL_INCOME" },

            //evaka income types not used in Tampere
            { codes: [], evakaType: "SECONDARY_INCOME" },
            { codes: [], evakaType: "UNEMPLOYMENT_BENEFITS" },
            { codes: [], evakaType: "ALL_EXPENSES", sign: "-" },
            { codes: [], evakaType: "PARENTAL_ALLOWANCE" },
            { codes: [], evakaType: "SICKNESS_ALLOWANCE" },
        ],

        //maps effica income period codes to evaka income periods
        incomePeriodMap: [
            { codes: [83], evakaType: "MONTHLY_NO_HOLIDAY_BONUS" },
            { codes: [111], evakaType: "DAILY_ALLOWANCE_21_5" },
            { codes: [112], evakaType: "DAILY_ALLOWANCE_25" },

            //evaka income periods not used in Tampere
            { codes: [], evakaType: "MONTHLY_WITH_HOLIDAY_BONUS" },
            { codes: [], evakaType: "BI_WEEKLY_NO_HOLIDAY_BONUS" },
            { codes: [], evakaType: "BI_WEEKLY_WITH_HOLIDAY_BONUS" },
            { codes: [], evakaType: "YEARLY" },
        ],
    }

}

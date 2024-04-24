// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
    CitySpecificApplicationStatusMappings,
    CitySpecificApplicationTypeMappings,
    CitySpecificDailyJournalReportCodeMappings,
    CitySpecificDeviationTypeMappings,
    CitySpecificIncomeMappings,
    CitySpecificPayDecisionStatusMappings,
    CitySpecificSpecialMeanMappings,
    CitySpecificSpecialNeedMappings,
    DecisionStatusType,
    SelectionPeriod
} from "../types/mappings";

export const SPECIAL_NEED_MAPPINGS: CitySpecificSpecialNeedMappings = {
    tampere: {
        207: "DEVELOPMENTAL_DISABILITY", // F Kehitysvamma
        240: "EXTENDED_COMPULSORY_EDUCATION", // V Pidennetty oppivelvollisuus
        252: "CHILD_ACCULTURATION_SUPPORT", // S Lapsen ja perheen kotout.
        440: "INTENSIFIED_ASSISTANCE", // 1. TEHOSTETTU Tuki
        441: "SPECIAL_ASSISTANCE_DECISION", // 2. ERITYINEN Tuki
    },
};

export const SPECIAL_MEAN_MAPPINGS: CitySpecificSpecialMeanMappings = {
    tampere: {
        // 375: null, // Tuettu esiopetus
        379: 30, // Integr. erityisryhmä - Kalevanharju
        // 380: null, // Pienryhmä
        // 381: null, // Kuntoutussuunnitelma
        415: 40, // Tukitoimi: Henkilökuntalisäys
        416: 70, // Kelton / Elton  tuki
        432: 20, // Erho
        // 433: null, // Esiop. uusi toimintamalli
        434: 10, // Henkilökohtainen avustaja
        // 435: null, // Integroitu erityisryhmä
        436: 50, // Integroitu ryhmä (vaka/eo)
        // 437: null, // Paikkatarve 2
        438: 10, // Ryhmäavustaja
        // 439: null, // Varhaisk. tuen uusi toimintama
        446: 60, // Osa-aikainen erityisopetus
    },
};

export const APPLICATION_TYPE_MAPPINGS: CitySpecificApplicationTypeMappings = {
    tampere: {
        999940001: "DAYCARE", // Päivähoitohakemus (BOA)
        999940002: "DAYCARE", // Päivähoitohakemus (BOB)
        999940003: null, // Hoitoajat (BOS)
        999940004: null, // Tuloselvitys (BON)
        999940005: null, // Hoitosuhteen irtisanominen (BOR)
        999940006: null, // Vastaus paikkatarjoukseen (BOX)
        999940010: null, // Paikkatarjous (PER)
        999940013: null, // Logg spara direkt (LOG)
        999940016: null, // Ryhmän vaihto (PAD)
        999940023: null, // Kerhohakemus (BOK)
        999940027: null, // Esiopetushakemus (PRO)
        999940028: null, // Kerhohakemu (BOD)
        999940029: null, // Esiopetushakemus (PRA)
        999940030: null, // Palveluseteli (PCS)
        999940031: null, // Kerhohakemus 2 (BOO)
    },
};

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
        40: { type: "DISCOUNT", notes: "MAKSUTON AP-IP" },
        41: { type: "DISCOUNT", notes: "MAKSUTON OSUUS" },
        47: { type: "DISCOUNT", notes: "SISARALENNUS" },
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
        493: null, // Vanhentunut
        999420001: "SENT", // Hyväksytty
        999420002: null, // Mitätöity
    },
};

export const PAY_DECISION_STATUS_MAPPINGS: CitySpecificPayDecisionStatusMappings = {
    tampere: {
        82: null, // Valmisteilla
        403: null, // xxxx
        493: null, // Vanhentunut
        999420001: "SENT", // Hyväksytty
        999420002: null, // Mitätöity
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
            absenceType: "FREE_ABSENCE",
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
            // ignore attendance
        },
        174: {
            // Hoidossa muualla (X)
            // absence counterpart for backup care (reportcode 176). for evaka only backup care should be inserted
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
            // ignore attendance
        },
        178: {
            // Hyvityspäivä (-)
            absenceType: "FORCE_MAJEURE",
        },
        409: {
            // Työntasausvp - Lapsi hoidossa
            // absence counterpart for backup care (reportcode 176). for evaka only backup care should be inserted
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

        // income type for fee decisions
        feeDecisionIncomeType: "MAIN_INCOME",

        // some incomerows rows need to be skipped if they use unwanted or erroneous incomeperiods
        // skipping rows only affects income detail listings, not actual total sums
        ignoredIncomePeriodCodes: [0, 450]
    }

}

//units that offer care for children ages 0-18 (erho), this affects placement end date marking
//if none, use impossible effica id value (<1)
export const SPECIAL_CARE_UNITS: Record<string, number[]> = {
    tampere: [272]
}

/*
As Effica is still in limited use for daily attendance, absence and backup care markings during the initial history data migration,
an additional markings focused migration phase is required to synchronize the final state of Effica with eVaka.
This is the single entry value for the inclusive markings data selection period used in the transformation of migration data.
*/
export const MARKINGS_SELECTION_PERIOD: Record<string, SelectionPeriod> = {
    tampere: { startDate: '1900-01-01', endDate: '2022-02-28' }
}


//eVaka ID of the unit that every childminder application is addressed to, used in application form transformation
export const CHILDMINDER_APPLICATION_UNIT: Record<string, string> = {
    tampere: 'cecdf326-0a56-11ec-90a9-e73454a1ee1a'
}

export interface CitySpecificMappings {
    financeDecisionMinDate: string;
    // effica enhet -> evaka daycare#name
    unitMapping: Record<string, string>;
    // effica omfattning -> service_need_option#id
    // SELECT jsonb_object_agg(omfattning, jsonb_build_object('serviceNeedOptionId', null)) FROM effica_placement;
    placementMapping: Record<
        string,
        {
            serviceNeedOptionId: string;
            privateServiceVoucherServiceNeedOptionId?: string;
        }
    >;
}

export const CITY_SPECIFIC_MAPPINGS: Record<string, CitySpecificMappings> = {
    seutu: {
        financeDecisionMinDate: "2024-01-01",
        unitMapping: {},
        placementMapping: {},
    },
    vesilahti: {
        financeDecisionMinDate: "2024-03-01",
        unitMapping: {},
        placementMapping: {
            "Varhaiskasvatus 0-90h": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
            },
            "Varhaiskasvatus 91-120h": {
                serviceNeedOptionId: "86ef70a0-bf85-11eb-91e6-1fb57a101165",
            },
            "Varhaiskasvatus 121-140h": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Varhaiskasvatus 141-155h": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Varhaiskasvatus 156-170h": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Varhaiskasvatus yli 170h": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Vuorohoito 121-140h": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Vuorohoito 141-155h": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Vuorohoito 156-170h": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Vuorohoito yli 170 h": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
        },
    },
    hameenkyro: {
        financeDecisionMinDate: "2024-03-01",
        unitMapping: {},
        placementMapping: {
            "*0-85 h/kk": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
                privateServiceVoucherServiceNeedOptionId:
                    "36c8c2ed-7543-47de-bc42-14d163a6277d",
            },
            "*86-139 h/kk": {
                serviceNeedOptionId: "86ef70a0-bf85-11eb-91e6-1fb57a101165",
                privateServiceVoucherServiceNeedOptionId:
                    "9eb82822-82ef-46fb-a123-29cf0af757b7",
            },
            "*Eo-täyd. osa-aikainen": {
                serviceNeedOptionId: "0a58db0a-6fd1-11ed-a75e-bbde95c1aded",
                privateServiceVoucherServiceNeedOptionId:
                    "fe0972a5-6ce9-41cc-a635-82fb22e7891b",
            },
            "Eo-täyd ph 0-85 h/k": {
                serviceNeedOptionId: "0a58d934-6fd1-11ed-a75e-c353faef5858",
                privateServiceVoucherServiceNeedOptionId:
                    "fe0972a5-6ce9-41cc-a635-82fb22e7891b",
            },
            "Eo-täyd ph 86-120 h/kk": {
                serviceNeedOptionId: "0a58dbe6-6fd1-11ed-a75e-5335f2b9a91c",
                privateServiceVoucherServiceNeedOptionId:
                    "fe0972a5-6ce9-41cc-a635-82fb22e7891b",
            },
            "Esiopetus 4t/päivä": {
                serviceNeedOptionId: "94e44ef1-106b-401d-81b6-8e5c31cd0437",
            },
            "*Kokopäivähoito": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
                privateServiceVoucherServiceNeedOptionId:
                    "f5d32585-2c78-4434-95d6-30b446db7d4d",
            },
            "*Kokopäivähoito 12 pv/kk": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
                privateServiceVoucherServiceNeedOptionId:
                    "36c8c2ed-7543-47de-bc42-14d163a6277d",
            },
            "Pkoti/ aikap. 0-85 h/kk": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
                privateServiceVoucherServiceNeedOptionId:
                    "36c8c2ed-7543-47de-bc42-14d163a6277d",
            },
            "Pkoti/ aikap. 121-140 h/kk": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
                privateServiceVoucherServiceNeedOptionId:
                    "9eb82822-82ef-46fb-a123-29cf0af757b7",
            },
            "Pkoti/ aikap. 141-155 h/kk": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
                privateServiceVoucherServiceNeedOptionId:
                    "f5d32585-2c78-4434-95d6-30b446db7d4d",
            },
            "Pkoti/ aikap. 156-170 h/kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
                privateServiceVoucherServiceNeedOptionId:
                    "f5d32585-2c78-4434-95d6-30b446db7d4d",
            },
            "Pkoti/ aikap. 86-120 h/kk": {
                serviceNeedOptionId: "86ef70a0-bf85-11eb-91e6-1fb57a101165",
                privateServiceVoucherServiceNeedOptionId:
                    "9eb82822-82ef-46fb-a123-29cf0af757b7",
            },
            "Pkoti/ aikap. yli 171 h/kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
                privateServiceVoucherServiceNeedOptionId:
                    "f5d32585-2c78-4434-95d6-30b446db7d4d",
            },
            "Pph/ aikap. 141-155 h/kk": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
                privateServiceVoucherServiceNeedOptionId:
                    "f5d32585-2c78-4434-95d6-30b446db7d4d",
            },
            "Pph/ aikap. 156-170 h/kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
                privateServiceVoucherServiceNeedOptionId:
                    "f5d32585-2c78-4434-95d6-30b446db7d4d",
            },
            "Pph/ aikap. yli 171 h/kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
                privateServiceVoucherServiceNeedOptionId:
                    "f5d32585-2c78-4434-95d6-30b446db7d4d",
            },
            "Tilapäinen hoito, kp": {
                serviceNeedOptionId: "e1063bee-c19d-469d-85a5-6b0350872d76",
            },
            "Vuorohoito 0-85 h/kk": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
                privateServiceVoucherServiceNeedOptionId:
                    "36c8c2ed-7543-47de-bc42-14d163a6277d",
            },
            "Vuorohoito 121-140 h/kk": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
                privateServiceVoucherServiceNeedOptionId:
                    "9eb82822-82ef-46fb-a123-29cf0af757b7",
            },
            "Vuorohoito 141-155 h/kk": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
                privateServiceVoucherServiceNeedOptionId:
                    "f5d32585-2c78-4434-95d6-30b446db7d4d",
            },
            "Vuorohoito 86-120 h/kk": {
                serviceNeedOptionId: "86ef70a0-bf85-11eb-91e6-1fb57a101165",
                privateServiceVoucherServiceNeedOptionId:
                    "9eb82822-82ef-46fb-a123-29cf0af757b7",
            },
            "Vuorohoito yli 171 h/kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
                privateServiceVoucherServiceNeedOptionId:
                    "f5d32585-2c78-4434-95d6-30b446db7d4d",
            },
            "* yli 140 h/kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
                privateServiceVoucherServiceNeedOptionId:
                    "f5d32585-2c78-4434-95d6-30b446db7d4d",
            },
        },
    },
    lempaala: {
        financeDecisionMinDate: "2024-05-01",
        unitMapping: {},
        placementMapping: {
            "Hoitoaikaporras 1, 0-85h/kk": {
                serviceNeedOptionId: "489dcf01-e11a-4ab8-8c36-1e672581eb6d",
            },
            "Vuorohoitoporras 1, 0-85h/kk": {
                serviceNeedOptionId: "489dcf01-e11a-4ab8-8c36-1e672581eb6d",
            },
            "Porras 1, palveluseteli  0-85h/kk": {
                serviceNeedOptionId: "489dcf01-e11a-4ab8-8c36-1e672581eb6d",
            },
            "Hoitoaikaporras 2, 86-120h/kk": {
                serviceNeedOptionId: "f24a1b37-0be9-4004-8a00-eefda8ed925a",
            },
            "Vuorohoitoporras 2, 86-120h/kk": {
                serviceNeedOptionId: "f24a1b37-0be9-4004-8a00-eefda8ed925a",
            },
            "Porras 2, palveluseteli 86-120h/kk": {
                serviceNeedOptionId: "f24a1b37-0be9-4004-8a00-eefda8ed925a",
            },
            "Hoitoaikaporras 3, 121-150h/kk": {
                serviceNeedOptionId: "a92cf108-0939-45f5-8976-ab31e456b84d",
            },
            "Vuorohoitoporras 3, 121-150h/kk": {
                serviceNeedOptionId: "a92cf108-0939-45f5-8976-ab31e456b84d",
            },
            "Porras 3, palveluseteli 121-150h/kk": {
                serviceNeedOptionId: "a92cf108-0939-45f5-8976-ab31e456b84d",
            },
            "Hoitoaikaporras 4, yli 151h/kk": {
                serviceNeedOptionId: "22adbfd9-50d8-4192-9a35-1c5ce872e1a7",
            },
            "Vuorohoitoporras 4, yli 151h/kk": {
                serviceNeedOptionId: "22adbfd9-50d8-4192-9a35-1c5ce872e1a7",
            },
            "Porras 4, palveluseteli yli 151h/kk": {
                serviceNeedOptionId: "22adbfd9-50d8-4192-9a35-1c5ce872e1a7",
            },
            "Tilapäinen hoito, kp": {
                serviceNeedOptionId: "e945728f-2671-4158-8941-1d39a3a36dce",
            },
            "Tilapäinen hoito, op": {
                serviceNeedOptionId: "e945728f-2671-4158-8941-1d39a3a36dce",
            },
        },
    },
    nokia: {
        financeDecisionMinDate: "2024-05-01",
        unitMapping: {},
        placementMapping: {
            "2-v Esiopetuskokeilu 4 h/pv": {
                serviceNeedOptionId: "94e44ef1-106b-401d-81b6-8e5c31cd0437",
            },
            "Esiopetus 4h/pv": {
                serviceNeedOptionId: "94e44ef1-106b-401d-81b6-8e5c31cd0437",
            },
            "Esiopetus+hoitoaika 0-50h": {
                serviceNeedOptionId: "0a58d934-6fd1-11ed-a75e-c353faef5858",
            },
            "Esiopetus+hoitoaika 121-140h": {
                serviceNeedOptionId: "0a58da38-6fd1-11ed-a75e-9b2790b0b4f5",
            },
            "Esiopetus+hoitoaika 141-155h": {
                serviceNeedOptionId: "0a58da38-6fd1-11ed-a75e-9b2790b0b4f5",
            },
            "Esiopetus+hoitoaika 156-170h": {
                serviceNeedOptionId: "0a58dcae-6fd1-11ed-a75e-b3e10433b949",
            },
            "Esiopetus+hoitoaika  51-85h": {
                serviceNeedOptionId: "0a58db0a-6fd1-11ed-a75e-bbde95c1aded",
            },
            "Esiopetus+hoitoaika  86-120h": {
                serviceNeedOptionId: "0a58dbe6-6fd1-11ed-a75e-5335f2b9a91c",
            },
            "Esiopetus+palveluseteli 0-50h": {
                serviceNeedOptionId: "fe0972a5-6ce9-41cc-a635-82fb22e7891b",
            },
            "Esiopetus+palveluseteli 51-85h": {
                serviceNeedOptionId: "fe0972a5-6ce9-41cc-a635-82fb22e7891b",
            },
            "Esiopetus+palveluseteli 86-139h": {
                serviceNeedOptionId: "b3102992-df96-45d5-a1c3-578791c2193c",
            },
            "Esiopetus+vuorohoito 121-140h": {
                serviceNeedOptionId: "0a58da38-6fd1-11ed-a75e-9b2790b0b4f5",
            },
            "Esiopetus+vuorohoito 141-155h": {
                serviceNeedOptionId: "0a58da38-6fd1-11ed-a75e-9b2790b0b4f5",
            },
            "Esiopetus+vuorohoito 156-170": {
                serviceNeedOptionId: "0a58dcae-6fd1-11ed-a75e-b3e10433b949",
            },
            "Esiopetus+vuorohoito 51-85h": {
                serviceNeedOptionId: "0a58db0a-6fd1-11ed-a75e-bbde95c1aded",
            },
            "Esiopetus+vuorohoito 86-120h": {
                serviceNeedOptionId: "0a58dbe6-6fd1-11ed-a75e-5335f2b9a91c",
            },
            "Hoitoaika  0-85h": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
            },
            "Hoitoaika 121-140h": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Hoitoaika 141-155h": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Hoitoaika 156-170h": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Hoitoaika 171h-": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Hoitoaika  86-120h": {
                serviceNeedOptionId: "86ef70a0-bf85-11eb-91e6-1fb57a101165",
            },
            "Palveluseteli 0-85h": {
                serviceNeedOptionId: "36c8c2ed-7543-47de-bc42-14d163a6277d",
            },
            "Palveluseteli 140h-": {
                serviceNeedOptionId: "f5d32585-2c78-4434-95d6-30b446db7d4d",
            },
            "Palveluseteli 86-139h": {
                serviceNeedOptionId: "9eb82822-82ef-46fb-a123-29cf0af757b7",
            },
            "Vuorohoito 0-85h": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
            },
            "Vuorohoito 121-140h": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Vuorohoito 141-155h": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Vuorohoito 156-170h": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Vuorohoito 171h-": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Vuorohoito 86-120h": {
                serviceNeedOptionId: "86ef70a0-bf85-11eb-91e6-1fb57a101165",
            },
        },
    },
    kangasala: {
        financeDecisionMinDate: "2024-05-01",
        unitMapping: {},
        placementMapping: {
            "2 v Esiopetuskokeilu 4 h/pv": {
                serviceNeedOptionId: "94e44ef1-106b-401d-81b6-8e5c31cd0437",
            },
            "Esiopetus 4t/päivä": {
                serviceNeedOptionId: "94e44ef1-106b-401d-81b6-8e5c31cd0437",
            },
            "Esiopetusta täydentävä 0-85 h/kk": {
                serviceNeedOptionId: "0a58db0a-6fd1-11ed-a75e-bbde95c1aded",
                privateServiceVoucherServiceNeedOptionId:
                    "fe0972a5-6ce9-41cc-a635-82fb22e7891b",
            },
            "Esiopetusta täydentävä 121-150 h/kk": {
                serviceNeedOptionId: "0a58da38-6fd1-11ed-a75e-9b2790b0b4f5",
                privateServiceVoucherServiceNeedOptionId:
                    "000a9d54-dd88-4f71-8489-b7d29e49ae92",
            },
            "Esiopetusta täydentävä 86-120 h/kk": {
                serviceNeedOptionId: "0a58dbe6-6fd1-11ed-a75e-5335f2b9a91c",
                privateServiceVoucherServiceNeedOptionId:
                    "b3102992-df96-45d5-a1c3-578791c2193c",
            },
            "Esiopetusta täydentävä yli 150 h/kk": {
                serviceNeedOptionId: "0a58dcae-6fd1-11ed-a75e-b3e10433b949",
            },
            "Esiop.täydentävä 0-50 h/kk 08/2024 alk": {
                serviceNeedOptionId: "0a58d934-6fd1-11ed-a75e-c353faef5858",
                privateServiceVoucherServiceNeedOptionId:
                    "fe0972a5-6ce9-41cc-a635-82fb22e7891b",
            },
            "Esiop.täydentävä 51-85 h/kk 08/2024 alk": {
                serviceNeedOptionId: "0a58db0a-6fd1-11ed-a75e-bbde95c1aded",
                privateServiceVoucherServiceNeedOptionId:
                    "fe0972a5-6ce9-41cc-a635-82fb22e7891b",
            },
            /*"Kuntoutuksellinen varhaiskasvatus": { serviceNeedOptionId: "" },
            "Kuntoutuksellinen varhaiskasv/esiopetus": {
                serviceNeedOptionId: "",
            },*/
            "Varhaiskasvatusaika 0-85 h/kk": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
            },
            "Varhaiskasvatusaika 121-150 h/kk": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Varhaiskasvatusaika 86-120 h/kk": {
                serviceNeedOptionId: "86ef70a0-bf85-11eb-91e6-1fb57a101165",
            },
            "Varhaiskasvatusaika yli 150 h/kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Virikekerho 1 kertaa/viikko": {
                serviceNeedOptionId: "ff6ddcd4-fa8a-11eb-8592-2f2b4e398fcb",
            },
            "Virikekerho 2 kertaa/viikko": {
                serviceNeedOptionId: "ff6ddcd4-fa8a-11eb-8592-2f2b4e398fcb",
            },
            "Vuorohoito 0-85 h/kk": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
            },
            "Vuorohoito 121-150 h/kk": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Vuorohoito 86-120 h/kk": {
                serviceNeedOptionId: "86ef70a0-bf85-11eb-91e6-1fb57a101165",
            },
            "Vuorohoito/esiop.täyd. 121-150 h/kk": {
                serviceNeedOptionId: "0a58da38-6fd1-11ed-a75e-9b2790b0b4f5",
                privateServiceVoucherServiceNeedOptionId:
                    "000a9d54-dd88-4f71-8489-b7d29e49ae92",
            },
            "Vuorohoito/esiop.täyd. 86-120 h/kk": {
                serviceNeedOptionId: "0a58dbe6-6fd1-11ed-a75e-5335f2b9a91c",
                privateServiceVoucherServiceNeedOptionId:
                    "b3102992-df96-45d5-a1c3-578791c2193c",
            },
            "Vuorohoito/esiop.täyd. yli 150 h/kk": {
                serviceNeedOptionId: "0a58dcae-6fd1-11ed-a75e-b3e10433b949",
            },
            "Vuorohoito yli 150 h/kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
        },
    },
    ylojarvi: {
        financeDecisionMinDate: "2024-05-01",
        unitMapping: {
            "Leikkitoiminta, Vihriälä": "Leikkitoiminta Vihriälä",
            "Touhula SatuVekara2,  Esiopetus": "Touhula SatuVekara2, Esiopetus",
        },
        placementMapping: {
            "Aikaperusteinen   0-85 h/kk alle 5h/pvä": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
            },
            "Aikaperusteinen   0-85 h/kk yli 5h/pvä": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
            },
            "Aikaperusteinen 121-140 h/kk": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Aikaperusteinen 141-155 h/kk": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Aikaperusteinen 156-170 h/kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Aikaperusteinen   86-120 h/kk": {
                serviceNeedOptionId: "86ef70a0-bf85-11eb-91e6-1fb57a101165",
            },
            "Aikaperusteinen yli 171 h/kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Avoin varhaiskasvatus 1krt/vko": {
                serviceNeedOptionId: "ff6ddcd4-fa8a-11eb-8592-2f2b4e398fcb",
            },
            "Avoin varhaiskasvatus 2krt/vk": {
                serviceNeedOptionId: "ff6ddcd4-fa8a-11eb-8592-2f2b4e398fcb",
            },
            "Avoin varhaiskasvatus 3krt/vko": {
                serviceNeedOptionId: "ff6ddcd4-fa8a-11eb-8592-2f2b4e398fcb",
            },
            "Avoin varhaiskasvatus 4krt/vko": {
                serviceNeedOptionId: "ff6ddcd4-fa8a-11eb-8592-2f2b4e398fcb",
            },
            "Esiopetus 4t/päivä": {
                serviceNeedOptionId: "94e44ef1-106b-401d-81b6-8e5c31cd0437",
            },
            "Palveluseteli Aikaperust 121-140h/kk": {
                serviceNeedOptionId: "f5d32585-2c78-4434-95d6-30b446db7d4d",
            },
            "Palveluseteli Aikaperust 141-155h/kk": {
                serviceNeedOptionId: "1b1e6e91-8d54-405c-88f8-2a95d88f8962",
            },
            "Palveluseteli Aikaperust 156-170h/kk": {
                serviceNeedOptionId: "4d6d632d-d8cf-4b5a-8437-decade30d0c0",
            },
            "Palveluseteli Aikaperust 86-120h/kk": {
                serviceNeedOptionId: "9eb82822-82ef-46fb-a123-29cf0af757b7",
            },
            "Palveluseteli Aikaperusteinen 0-85h/kk": {
                serviceNeedOptionId: "36c8c2ed-7543-47de-bc42-14d163a6277d",
            },
            "Palveluseteli Aikaperust yli 171h/kk": {
                serviceNeedOptionId: "d7d8b130-ac3b-4447-adc8-ef7f6ef0b653",
            },
            "Palveluseteli eo täyd aikap 121-140h/kk": {
                serviceNeedOptionId: "a8ae87a0-a326-4170-99da-088fb8679797",
            },
            "Palveluseteli eo täyd aikap  51h-85h/kk": {
                serviceNeedOptionId: "fe0972a5-6ce9-41cc-a635-82fb22e7891b",
            },
            "Palveluseteli eo täyd aikap 86-120h/kk": {
                serviceNeedOptionId: "ff4268de-0ae6-4e54-abbe-b296f5f03d4b",
            },
            "Pkoti/Aikaperusteinen   0h-85h/kk": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
            },
            "Pkoti/Aikaperusteinen 121h-140h/kk": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Pkoti/Aikaperusteinen 141h-155h/kk": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Pkoti/Aikaperusteinen 156h-170h/kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Pkoti/Aikaperusteinen  86h-120h/kk": {
                serviceNeedOptionId: "86ef70a0-bf85-11eb-91e6-1fb57a101165",
            },
            "Pkoti/Aikaperusteinen yli 171h- /kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Pkoti/Esiop täyd aikaper   0h-50h/kk": {
                serviceNeedOptionId: "0a58d934-6fd1-11ed-a75e-c353faef5858",
            },
            "Pkoti/Esiop täyd aikaper  0h-85h/kk": {
                serviceNeedOptionId: "0a58db0a-6fd1-11ed-a75e-bbde95c1aded",
            },
            "Pkoti/Esiop täyd aikaper 121h-140h/kk": {
                serviceNeedOptionId: "0a58da38-6fd1-11ed-a75e-9b2790b0b4f5",
            },
            "Pkoti/Esiop täyd aikaper   51h-85h/kk": {
                serviceNeedOptionId: "0a58db0a-6fd1-11ed-a75e-bbde95c1aded",
            },
            "Pkoti/Esiop täyd aikaper  86h-120h/kk": {
                serviceNeedOptionId: "0a58dbe6-6fd1-11ed-a75e-5335f2b9a91c",
            },
            "Pph/Aikaperusteinen 121h-140h/kk": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Pph/Aikaperusteinen 141h-155h/kk": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Pph/Aikaperusteinen 156h-170h/kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Pph/Aikaperusteinen yli 171h /kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Tilapäinen hoito, yli 5 t": {
                serviceNeedOptionId: "e1063bee-c19d-469d-85a5-6b0350872d76",
            },
            "Vuoroh/Aikaperusteinen  0h-85h/kk": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
            },
            "Vuoroh/Aikaperusteinen 121h-140h/kk": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Vuoroh/Aikaperusteinen 141h-155h/kk": {
                serviceNeedOptionId: "503590f0-b961-11eb-b520-53740af3f7ef",
            },
            "Vuoroh/Aikaperusteinen 156h-170h/kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Vuoroh/Aikaperusteinen  86h-120h/kk": {
                serviceNeedOptionId: "86ef70a0-bf85-11eb-91e6-1fb57a101165",
            },
            "Vuoroh/Aikaperusteinen yli 171h- /kk": {
                serviceNeedOptionId: "503591ae-b961-11eb-b521-1fca99358eed",
            },
            "Vuoroh/Esiop täyd aikaper  0h-50h/kk": {
                serviceNeedOptionId: "0a58d934-6fd1-11ed-a75e-c353faef5858",
            },
            "Vuoroh/Esiop täyd aikaper  0h-85h/kk": {
                serviceNeedOptionId: "0a58db0a-6fd1-11ed-a75e-bbde95c1aded",
            },
            "Vuoroh/Esiop täyd aikaper 121-140h/kk": {
                serviceNeedOptionId: "0a58da38-6fd1-11ed-a75e-9b2790b0b4f5",
            },
            "Vuoroh/Esiop täyd aikaper  51-85h/kk": {
                serviceNeedOptionId: "0a58db0a-6fd1-11ed-a75e-bbde95c1aded",
            },
            "Vuoroh/Esiop täyd aikaper  86-120h/kk": {
                serviceNeedOptionId: "0a58dbe6-6fd1-11ed-a75e-5335f2b9a91c",
            },
            "Aikaperusteinen 0-85 h/kk alle 5h/pvä": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
            },
            "Aikaperusteinen 0-85 h/kk yli 5h/pvä": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
            },
            "Aikaperusteinen 86-120 h/kk": {
                serviceNeedOptionId: "86ef70a0-bf85-11eb-91e6-1fb57a101165",
            },
            "Pkoti/Aikaperusteinen 0h-85h/kk": {
                serviceNeedOptionId: "50358394-b961-11eb-b51f-67ac436e5637",
            },
            "Pkoti/Esiop täyd aikaper 51h-85h/kk": {
                serviceNeedOptionId: "0a58db0a-6fd1-11ed-a75e-bbde95c1aded",
            },
            "Vuoroh/Esiop täyd aikaper 51-85h/kk": {
                serviceNeedOptionId: "0a58db0a-6fd1-11ed-a75e-bbde95c1aded",
            },
            "Vuoroh/Esiop täyd aikaper 86-120h/kk": {
                serviceNeedOptionId: "0a58dbe6-6fd1-11ed-a75e-5335f2b9a91c",
            },
        },
    },
    pirkkala: {
        financeDecisionMinDate: "2024-05-01",
        unitMapping: {},
        placementMapping: {},
    },
};

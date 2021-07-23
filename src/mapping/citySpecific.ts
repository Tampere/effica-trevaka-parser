import { CitySpecificIncomeMappings } from "../types/mappings";

//FIXME: tampere mapping currently unfinished, to be completed in TREV-267
export const citySpecificIncomeMappings: CitySpecificIncomeMappings = {
    tampere: {
        coefficientMap: {
            MONTHLY_NO_HOLIDAY_BONUS: "1.0",
            MONTHLY_WITH_HOLIDAY_BONUS: "1.0417",
            BI_WEEKLY_WITH_HOLIDAY_BONUS: "2.2323",
            BI_WEEKLY_NO_HOLIDAY_BONUS: "2.1429",
            YEARLY: "0.0833"
        },

        //map effica income type codes to evaka income types
        incomeTypeMap: [
            { codes: [19], evakaType: "PARENTAL_ALLOWANCE" },
            { codes: [20], evakaType: "SICKNESS_ALLOWANCE" },
            { codes: [87], evakaType: "ALIMONY" },
            { codes: [84], evakaType: "PENSION" },
            { codes: [451], evakaType: "HOME_CARE_ALLOWANCE" },
            { codes: [108], evakaType: "OTHER_INCOME" },
            { codes: [85], evakaType: "MAIN_INCOME" },
            { codes: [26], evakaType: "SECONDARY_INCOME" },
            { codes: [27], evakaType: "UNEMPLOYMENT_BENEFITS" },
            { codes: [28], evakaType: "ALL_EXPENSES", sign: "-" }
        ],

        //map effica income period codes to evaka coeffs
        incomePeriodMap: [
            { codes: [83], evakaType: "MONTHLY_NO_HOLIDAY_BONUS" },
            { codes: [108, 416], evakaType: "MONTHLY_WITH_HOLIDAY_BONUS" },
            { codes: [32], evakaType: "BI_WEEKLY_NO_HOLIDAY_BONUS" },
            { codes: [110], evakaType: "BI_WEEKLY_WITH_HOLIDAY_BONUS" },
            { codes: [31], evakaType: "YEARLY" },
        ],
    }

}

// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import { config } from "../config";
import migrationDb from "../db/db";
import { DAILYJOURNAL_REPORTCODE_MAPPINGS } from "../mapping/citySpecific";
import {
    baseQueryParameters,
    runQuery,
    runQueryFile,
    selectFromTable,
} from "../util/queryTools";

export const transformDailyJournalsData = async (
    returnAll: boolean = false
) => {
    return migrationDb.tx(async (t) => {
        return {
            ...(await transformDailyJournals(t, returnAll)),
        };
    });
};

const transformDailyJournals = async <T>(t: ITask<T>, returnAll: boolean) => {
    await runQueryFile("transform-daily-journal.sql", t, {
        ...baseQueryParameters,
        allReportCodes: getAllReportCodes(config.cityVariant),
        absenceTypeMappings: getAbsenceTypeMappings(config.cityVariant),
        backupCareTypes: getBackupCareTypes(config.cityVariant),
    });

    const absences = await runQuery(
        selectFromTable("evaka_absence", config.migrationSchema, returnAll),
        t,
        true
    );
    const absencesTodo = await runQuery(
        selectFromTable(
            "evaka_absence_todo",
            config.migrationSchema,
            returnAll
        ),
        t,
        true
    );
    const backupCares = await runQuery(
        selectFromTable(
            "evaka_backup_care",
            config.migrationSchema,
            returnAll,
            ["start_date", "end_date"]
        ),
        t,
        true
    );
    const backupCaresTodo = await runQuery(
        selectFromTable(
            "evaka_backup_care_todo",
            config.migrationSchema,
            returnAll,
            ["start_date", "end_date"]
        ),
        t,
        true
    );
    return { absences, absencesTodo, backupCares, backupCaresTodo };
};

const getAllReportCodes = (cityVariant: string) => {
    return Object.keys(DAILYJOURNAL_REPORTCODE_MAPPINGS[cityVariant]);
};

const getAbsenceTypeMappings = (cityVariant: string) => {
    return Object.entries(DAILYJOURNAL_REPORTCODE_MAPPINGS[cityVariant]).reduce(
        (prev, [reportcode, { absenceType }]) => ({
            ...prev,
            ...(absenceType !== undefined && { [reportcode]: absenceType }),
        }),
        {}
    );
};

const getBackupCareTypes = (cityVariant: string) => {
    return Object.entries(DAILYJOURNAL_REPORTCODE_MAPPINGS[cityVariant])
        .filter(([_, { backupCare }]) => backupCare === true)
        .map(([reportcode]) => reportcode);
};

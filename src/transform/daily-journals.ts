// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import { config } from "../config";
import migrationDb from "../db/db";
import {
    ABSENCE_TYPE_MAPPINGS,
    BACKUP_CARE_TYPES,
} from "../mapping/citySpecific";
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
        types: ABSENCE_TYPE_MAPPINGS[config.cityVariant],
        backupCareTypes: BACKUP_CARE_TYPES[config.cityVariant],
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
        selectFromTable("evaka_backup_care", config.migrationSchema, returnAll),
        t,
        true
    );
    const backupCaresTodo = await runQuery(
        selectFromTable(
            "evaka_backup_care_todo",
            config.migrationSchema,
            returnAll
        ),
        t,
        true
    );
    return { absences, absencesTodo, backupCares, backupCaresTodo };
};

// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import { config } from "../config";
import migrationDb from "../db/db";
import { MARKINGS_SELECTION_PERIOD } from "../mapping/citySpecific";
import {
    baseQueryParameters,
    runQuery,
    runQueryFile,
    selectFromTable
} from "../util/queryTools";

export const transformTimestampsData = async (returnAll: boolean = false) => {
    return migrationDb.tx(async (t) => {
        return {
            ...(await transformTimestamps(t, returnAll)),
        };
    });
};

const transformTimestamps = async <T>(t: ITask<T>, returnAll: boolean) => {
    const selectionPeriod = getSelectionPeriod(config.cityVariant)
    await runQueryFile("transform-timestamps.sql", t, {
        ...baseQueryParameters,
        selectionPeriodStartDate: selectionPeriod.startDate,
        selectionPeriodEndDate: selectionPeriod.endDate
    });

    const childAttendances = await runQuery(
        selectFromTable(
            "evaka_child_attendance",
            config.migrationSchema,
            returnAll
        ),
        t,
        true
    );
    const childAttendancesTodo = await runQuery(
        selectFromTable(
            "evaka_child_attendance_todo",
            config.migrationSchema,
            returnAll
        ),
        t,
        true
    );
    return { childAttendances, childAttendancesTodo };
};

const getSelectionPeriod = (cityVariant: string) => {
    return MARKINGS_SELECTION_PERIOD[cityVariant]
}
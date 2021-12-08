// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import { config } from "../config";
import migrationDb from "../db/db";
import { SPECIAL_MEAN_MAPPINGS } from "../mapping/citySpecific";
import {
    baseQueryParameters,
    runQuery,
    runQueryFile,
    selectFromTable,
} from "../util/queryTools";

export const transformSpecialMeansData = async (returnAll: boolean = false) => {
    return migrationDb.tx(async (t) => {
        return {
            ...(await transformSpecialMeans(t, returnAll)),
        };
    });
};

const transformSpecialMeans = async <T>(t: ITask<T>, returnAll: boolean) => {
    await runQueryFile("transform-special-means.sql", t, {
        ...baseQueryParameters,
        typeMappings: SPECIAL_MEAN_MAPPINGS[config.cityVariant],
    });

    const assistanceActions = await runQuery(
        selectFromTable(
            "evaka_assistance_action",
            config.migrationSchema,
            returnAll,
            ["start_date", "end_date"]
        ),
        t,
        true
    );
    const assistanceActionsTodo = await runQuery(
        selectFromTable(
            "evaka_assistance_action_todo",
            config.migrationSchema,
            returnAll
        ),
        t,
        true
    );
    return { assistanceActions, assistanceActionsTodo };
};

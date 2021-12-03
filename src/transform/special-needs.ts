// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import { config } from "../config";
import migrationDb from "../db/db";
import { SPECIAL_NEED_MAPPINGS } from "../mapping/citySpecific";
import {
    baseQueryParameters,
    runQuery,
    runQueryFile,
    selectFromTable,
} from "../util/queryTools";

export const transformSpecialNeedsData = async (returnAll: boolean = false) => {
    return migrationDb.tx(async (t) => {
        return {
            ...(await transformSpecialNeeds(t, returnAll)),
        };
    });
};

const transformSpecialNeeds = async <T>(t: ITask<T>, returnAll: boolean) => {
    await runQueryFile("transform-special-needs.sql", t, {
        ...baseQueryParameters,
        typeMappings: SPECIAL_NEED_MAPPINGS[config.cityVariant],
    });

    const assistanceNeeds = await runQuery(
        selectFromTable(
            "evaka_assistance_need",
            config.migrationSchema,
            returnAll
        ),
        t,
        true
    );
    const assistanceNeedsTodo = await runQuery(
        selectFromTable(
            "evaka_assistance_need_todo",
            config.migrationSchema,
            returnAll
        ),
        t,
        true
    );
    return { assistanceNeeds, assistanceNeedsTodo };
};

// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import { config } from "../config";
import migrationDb from "../db/db";
import { SPECIAL_CARE_UNITS } from "../mapping/citySpecific";
import {
    baseQueryParameters,
    runQuery,
    runQueryFile,
    selectFromTable
} from "../util/queryTools";

export const transformPlacementsData = async (returnAll: boolean = false) => {
    return migrationDb.tx(async (t) => {
        return {
            ...(await transformPlacements(t, returnAll)),
        };
    });
};

const transformPlacements = async <T>(t: ITask<T>, returnAll: boolean) => {
    await runQueryFile("transform-placement.sql", t, { ...baseQueryParameters, erhoUnits: SPECIAL_CARE_UNITS[config.cityVariant] });

    const placements = await runQuery(
        selectFromTable("evaka_placement", config.migrationSchema, returnAll, [
            "effica_placement_nbr",
            "effica_extent_nbr",
        ]),
        t,
        true
    );
    const placementsTodo = await runQuery(
        selectFromTable(
            "evaka_placement_todo",
            config.migrationSchema,
            returnAll,
            ["effica_placement_nbr", "effica_extent_nbr", "reason DESC"]
        ),
        t,
        true
    );
    return { placements, placementsTodo };
};

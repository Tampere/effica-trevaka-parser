// SPDX-FileCopyrightText: 2023-2024 Tampere region
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import { baseQueryParameters, runQueryFile } from "./util/queryTools";
import { Config } from "./config";
import { CITY_SPECIFIC_MAPPINGS } from "./mapping/citySpecific";

export const transform = async <T>(
    t: ITask<T>,
    type: string,
    config: Config,
) => {
    const citySpecificMappings = CITY_SPECIFIC_MAPPINGS[config.cityVariant];
    const vtjQueried = config.mockVtj ? "2021-05-01" : null;
    await runQueryFile(
        `transform/${type}.sql`,
        t,
        {
            ...baseQueryParameters,
            ...citySpecificMappings,
            vtjQueried,
        },
        true,
    );
};

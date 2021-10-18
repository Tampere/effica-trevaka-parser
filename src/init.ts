// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "./db/db";
import { baseQueryParameters, runQueryFile } from "./util/queryTools";

export const initDb = async () => {
    return await migrationDb.tx(async (t) => {
        await runQueryFile("init.sql", t, baseQueryParameters);
        await runQueryFile("functions.sql", t, baseQueryParameters);
    });
};

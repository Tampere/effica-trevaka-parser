// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "../db/db";
import { ensureEfficaUser } from "../db/evaka";
import {
    baseQueryParameters,
    runQuery,
    runQueryFile,
    selectFromTable,
} from "../util/queryTools";

export const transferAbsences = async (returnAll: boolean = false) => {
    return await migrationDb.tx(async (t) => {
        const modifiedBy = await ensureEfficaUser(t);
        await runQueryFile("transfer-absence.sql", t, {
            ...baseQueryParameters,
            modifiedBy,
        });
        return await runQuery(
            selectFromTable("absence", "", returnAll, ["date"]),
            t,
            true
        );
    });
};

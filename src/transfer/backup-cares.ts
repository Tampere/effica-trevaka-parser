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

export const transferBackupCares = async (returnAll: boolean = false) => {
    return await migrationDb.tx(async (t) => {
        const modifiedBy = await ensureEfficaUser(t);
        await runQueryFile("transfer-backup-cares.sql", t, {
            ...baseQueryParameters,
            modifiedBy,
        });
        return await runQuery(
            selectFromTable("backup_care", "", returnAll, [
                "start_date",
                "end_date",
            ]),
            t,
            true
        );
    });
};

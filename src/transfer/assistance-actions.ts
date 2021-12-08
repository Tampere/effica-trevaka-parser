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

export const transferAssistanceActionsData = async (
    returnAll: boolean = false
) => {
    return await migrationDb.tx(async (t) => {
        const updatedBy = await ensureEfficaUser(t);
        await runQueryFile("transfer-assistance-actions.sql", t, {
            ...baseQueryParameters,
            updatedBy,
        });
        const assistanceActions = await runQuery(
            selectFromTable("assistance_action", "", returnAll),
            t,
            true
        );
        const assistanceActionOptions = await runQuery(
            selectFromTable("assistance_action_option_ref", "", returnAll),
            t,
            true
        );
        return { assistanceActions, assistanceActionOptions };
    });
};

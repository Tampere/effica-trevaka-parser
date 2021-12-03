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

export const transferAssistanceNeedsData = async (
    returnAll: boolean = false
) => {
    return await migrationDb.tx(async (t) => {
        const updatedBy = await ensureEfficaUser(t);
        await runQueryFile("transfer-assistance-needs.sql", t, {
            ...baseQueryParameters,
            updatedBy,
        });
        const assistanceNeeds = await runQuery(
            selectFromTable("assistance_need", "", returnAll, [
                "start_date",
                "end_date",
            ]),
            t,
            true
        );
        const assistanceBases = await runQuery(
            selectFromTable("assistance_basis_option_ref", "", returnAll),
            t,
            true
        );
        return { assistanceNeeds, assistanceBases };
    });
};

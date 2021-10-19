// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "../db/db";
import {
    baseQueryParameters,
    runQuery,
    runQueryFile,
    selectFromTable,
} from "../util/queryTools";

export const transferVoucherValueDecisions = async (
    returnAll: boolean = false
) => {
    return await migrationDb.tx(async (t) => {
        await runQueryFile("transfer-voucher-value-decision.sql", t, {
            ...baseQueryParameters,
        });
        return await runQuery(
            selectFromTable("voucher_value_decision", "", returnAll, [
                "decision_number",
            ]),
            t,
            true
        );
    });
};

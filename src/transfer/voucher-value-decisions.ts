// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { config } from "../config";
import migrationDb from "../db/db";
import { runQuery, runQueryFile, selectFromTable } from "../util/queryTools";

const queryParameters = {
    migrationSchema: config.migrationSchema,
    extensionSchema: config.extensionSchema,
};

export const transferVoucherValueDecisions = async (
    returnAll: boolean = false
) => {
    return await migrationDb.tx(async (t) => {
        await runQueryFile("transfer-voucher-value-decision.sql", t, {
            ...queryParameters,
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

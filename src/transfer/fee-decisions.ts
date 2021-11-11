// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import migrationDb from "../db/db";
import {
    baseQueryParameters,
    runQuery,
    runQueryFile,
    selectFromTable,
} from "../util/queryTools";

export const transferFeeDecisionData = async (returnAll: boolean = false) => {
    return migrationDb.tx(async (t) => {
        return {
            ...(await transferFeeDecisions(t, returnAll)),
        };
    });
};

const transferFeeDecisions = async <T>(t: ITask<T>, returnAll: boolean) => {
    await runQueryFile("transfer-fee-decision.sql", t, baseQueryParameters);

    const feeDecisions = await runQuery(
        selectFromTable("fee_decision", "", returnAll, ["valid_during"]),
        t,
        true
    );
    const feeDecisionChildren = await runQuery(
        selectFromTable("fee_decision_child", "", returnAll, [
            "child_date_of_birth",
        ]),
        t,
        true
    );
    return { feeDecisions, feeDecisionChildren };
};

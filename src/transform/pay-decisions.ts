// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import { config } from "../config";
import migrationDb from "../db/db";
import { PAY_DECISION_STATUS_MAPPINGS } from "../mapping/citySpecific";
import {
    baseQueryParameters,
    runQuery,
    runQueryFile,
    selectFromTable,
} from "../util/queryTools";

export const transformPayDecisionData = async (returnAll: boolean = false) => {
    return migrationDb.tx(async (t) => {
        return {
            ...(await transformPayDecisions(t, returnAll)),
        };
    });
};

const transformPayDecisions = async <T>(t: ITask<T>, returnAll: boolean) => {
    const statusMappings = PAY_DECISION_STATUS_MAPPINGS[config.cityVariant];
    await runQueryFile("transform-pay-decision.sql", t, {
        ...baseQueryParameters,
        statusMappings,
        allStatuses: Object.keys(statusMappings),
    });

    const feeDecisions = await runQuery(
        selectFromTable(
            "evaka_fee_decision",
            config.migrationSchema,
            returnAll,
            ["start_date", "end_date"]
        ),
        t,
        true
    );
    const feeDecisionsTodo = await runQuery(
        selectFromTable(
            "evaka_fee_decision_todo",
            config.migrationSchema,
            returnAll,
            ["start_date", "end_date"]
        ),
        t,
        true
    );
    const feeDecisionChildren = await runQuery(
        selectFromTable(
            "evaka_fee_decision_child",
            config.migrationSchema,
            returnAll
        ),
        t,
        true
    );
    const feeDecisionChildrenTodo = await runQuery(
        selectFromTable(
            "evaka_fee_decision_child_todo",
            config.migrationSchema,
            returnAll
        ),
        t,
        true
    );

    return {
        feeDecisions,
        feeDecisionsTodo,
        feeDecisionChildren,
        feeDecisionChildrenTodo,
    };
};

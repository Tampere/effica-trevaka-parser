// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { config } from "../config";
import migrationDb from "../db/db";
import {
    DECISION_STATUS_TYPE_MAPPINGS,
    VOUCHER_VALUE_DECISION_TYPES,
} from "../mapping/citySpecific";
import {
    baseQueryParameters,
    runQuery,
    runQueryFile,
    selectFromTable,
} from "../util/queryTools";

export const transformVoucherValueDecisionData = async (
    returnAll: boolean = false
) => {
    return await migrationDb.tx(async (t) => {
        await runQueryFile("transform-voucher-value-decision.sql", t, {
            ...baseQueryParameters,
            statusMappings: DECISION_STATUS_TYPE_MAPPINGS[config.cityVariant],
            allStatuses: Object.keys(
                DECISION_STATUS_TYPE_MAPPINGS[config.cityVariant]
            ),
            types: VOUCHER_VALUE_DECISION_TYPES[config.cityVariant],
        });

        const decisions = await runQuery(
            selectFromTable(
                "evaka_voucher_value_decision",
                config.migrationSchema,
                returnAll,
                ["decision_number"]
            ),
            t,
            true
        );
        const decisionsTodo = await runQuery(
            selectFromTable(
                "evaka_voucher_value_decision_todo",
                config.migrationSchema,
                returnAll,
                ["decision_number"]
            ),
            t,
            true
        );
        return { decisions, decisionsTodo };
    });
};

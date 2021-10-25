// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import migrationDb from "../db/db";
import {
    getMigrationSchemaPrefix,
    runQuery,
    wrapWithReturning,
} from "../util/queryTools";

export const cleanupData = async (returnAll: boolean = false) => {
    return migrationDb.tx(async (t) => {
        return {
            cleanedDaycareGroups: await cleanupEmptyDaycareGroups(t, returnAll),
        };
    });
};

const cleanupEmptyDaycareGroups = async <T>(
    t: ITask<T>,
    returnAll: boolean
) => {
    const deleteQueryPart = `
        DELETE FROM ${getMigrationSchemaPrefix()}evaka_daycare_group
        WHERE id NOT IN (
            SELECT DISTINCT daycare_group_id
            FROM ${getMigrationSchemaPrefix()}evaka_placement
            WHERE daycare_group_id IS NOT NULL
            UNION
            SELECT DISTINCT group_id
            FROM ${getMigrationSchemaPrefix()}evaka_backup_care
            WHERE group_id IS NOT NULL
        )
    `;
    const deleteQuery = wrapWithReturning(
        "evaka_daycare_group",
        deleteQueryPart,
        returnAll
    );

    return await runQuery(deleteQuery, t, true);
};

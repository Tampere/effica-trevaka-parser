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
import { ensureEfficaUser } from "../db/evaka";

export const transferFamiliesData = async (returnAll: boolean = false) => {
    return await migrationDb.tx(async (t) => {
        const efficaUser = await ensureEfficaUser(t);
        return {
            children: await transferChildData(t, returnAll),
            partners: await transferPartnerData(t, returnAll, efficaUser),
        };
    });
};

const transferChildData = async <T>(t: ITask<T>, returnAll: boolean) => {
    const insertQueryPart = `
    INSERT INTO fridge_child
        (child_id, head_of_child, start_date, end_date, conflict)
    SELECT
        child_id, head_of_family, start_date, end_date, false
    FROM ${getMigrationSchemaPrefix()}evaka_fridge_child
    `;
    const insertQuery = wrapWithReturning(
        "fridge_child",
        insertQueryPart,
        returnAll
    );

    return await runQuery(insertQuery, t, true);
};

const transferPartnerData = async <T>(t: ITask<T>, returnAll: boolean, efficaUser: string) => {
    const insertQueryPart = `
    INSERT INTO fridge_partner
        (partnership_id, indx, person_id, start_date, end_date, conflict, other_indx, created_at, created_by)
    SELECT
        partnership_id, indx, person_id, start_date, end_date, false, other_indx, now(), '${efficaUser}'
    FROM ${getMigrationSchemaPrefix()}evaka_fridge_partner
    `;
    const insertQuery = wrapWithReturning(
        "fridge_partner",
        insertQueryPart,
        returnAll
    );

    return await runQuery(insertQuery, t, true);
};

// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "../db/db";
import {
    getMigrationSchemaPrefix,
    runQuery,
    wrapWithReturning,
} from "../util/queryTools";

export const transferUnitManagerData = async (returnAll: boolean = false) => {
    const insertQueryPart = `
    INSERT INTO unit_manager 
    (id, name, email, phone)
        SELECT
            id,
            name,
            email,
            phone
        FROM ${getMigrationSchemaPrefix()}evaka_unit_manager um
    `
    const insertQuery = wrapWithReturning("unit_manager", insertQueryPart, returnAll)

    return await migrationDb.tx(async (t) => {
        return await runQuery(insertQuery, t, true)
    })
};

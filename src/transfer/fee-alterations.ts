// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "../db/db";
import { ensureEfficaUser } from "../db/evaka";
import {
    getMigrationSchemaPrefix,
    runQuery,
    wrapWithReturning,
} from "../util/queryTools";

export const transferFeeAlterationsData = async (
    returnAll: boolean = false
) => {
    const insertQueryPart = `
    INSERT INTO fee_alteration
        (id, person_id, type, amount, is_absolute, valid_from, valid_to, notes, updated_at, updated_by)
    SELECT
        id,
        person_id,
        type::fee_alteration_type,
        amount,
        is_absolute,
        valid_from,
        valid_to,
        notes,
        now(),
        $(updatedBy)
    FROM ${getMigrationSchemaPrefix()}evaka_fee_alteration
    `;
    const insertQuery = wrapWithReturning(
        "fee_alteration",
        insertQueryPart,
        returnAll
    );

    return await migrationDb.tx(async (t) => {
        const updatedBy = await ensureEfficaUser(t);
        return await runQuery(insertQuery, t, true, { updatedBy });
    });
};

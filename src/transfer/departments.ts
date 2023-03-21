// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "../db/db"
import { getMigrationSchemaPrefix, runQuery, wrapWithReturning } from "../util/queryTools"

export const transferDepartmentData = async (returnAll: boolean = false) => {
    const insertQueryPart = `
    INSERT INTO daycare_group
        (id, daycare_id, name, start_date, end_date)
    SELECT
        id, daycare_id, name, start_date, end_date
    FROM ${getMigrationSchemaPrefix()}evaka_daycare_group
    `
    const insertQuery = wrapWithReturning("daycare_group", insertQueryPart, returnAll)

    const caretakersQueryPart = `
        INSERT INTO daycare_caretaker (group_id, amount, start_date, end_date)
        SELECT id, $(amount), start_date, end_date FROM ${getMigrationSchemaPrefix()}evaka_daycare_group
    `;

    const caretakersQuery = wrapWithReturning(
        "daycare_caretaker",
        caretakersQueryPart,
        returnAll
    );

    // from V84__create_message_accounts.sql
    const messageAccountQuery = `
    INSERT INTO message_account (daycare_group_id, type)
    SELECT id, 'GROUP'
    FROM daycare_group
    ON CONFLICT DO NOTHING
    RETURNING *;
    `;

    return await migrationDb.tx(async (t) => {
        const groups = await runQuery(insertQuery, t, true);
        const caretakers = await runQuery(caretakersQuery, t, true, {
            amount: 3,
        });
        const messageAccounts = await runQuery(messageAccountQuery, t, true);
        return { groups, caretakers, messageAccounts };
    });
}

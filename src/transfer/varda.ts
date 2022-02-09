// SPDX-FileCopyrightText: 2021-2022 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "../db/db";
import {
    baseQueryParameters,
    runQuery,
    wrapWithReturning,
} from "../util/queryTools";

export const transferVarda = async (returnAll: boolean = false) => {
    return await migrationDb.tx(async (t) => {
        return await runQuery(
            wrapWithReturning("varda_organizer_child", transferSql, returnAll, [
                "varda_child_id",
            ]),
            t,
            true,
            baseQueryParameters
        );
    });
};

const transferSql = `
    INSERT INTO varda_organizer_child
        (evaka_person_id, varda_person_oid, varda_person_id, varda_child_id, organizer_oid)
    SELECT
        evaka_person_id, varda_person_oid, varda_person_id, varda_child_id, organizer_oid
    FROM $(migrationSchema:name).evaka_varda_organizer_child
`;

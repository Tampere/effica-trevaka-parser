// SPDX-FileCopyrightText: 2021-2022 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "../db/db";
import {
    baseQueryParameters,
    runQuery,
    wrapWithReturning,
} from "../util/queryTools";

export const transformVarda = async (returnAll: boolean = false) => {
    return await migrationDb.tx(async (t) => {
        await runQuery(tableSql, t, false, baseQueryParameters);
        return await runQuery(
            wrapWithReturning(
                "evaka_varda_organizer_child",
                transformSql,
                returnAll,
                ["varda_child_id"]
            ),
            t,
            true,
            baseQueryParameters
        );
    });
};

const tableSql = `
    DROP TABLE IF EXISTS $(migrationSchema:name).evaka_varda_organizer_child;
    CREATE TABLE $(migrationSchema:name).evaka_varda_organizer_child (
        evaka_person_id UUID NOT NULL,
        varda_person_oid TEXT NOT NULL,
        varda_person_id BIGINT NOT NULL,
        varda_child_id BIGINT NOT NULL,
        organizer_oid TEXT NOT NULL
    );
`;

const transformSql = `
    INSERT INTO $(migrationSchema:name).evaka_varda_organizer_child
        (evaka_person_id, varda_person_oid, varda_person_id, varda_child_id, organizer_oid)
    SELECT
        ep.id, vp.henkilo_oid, vp.id, vc.id, CASE
            WHEN vc.paos_kytkin THEN vc.paos_organisaatio_oid
            ELSE vc.vakatoimija_oid
        END
    FROM $(migrationSchema:name).varda_child vc
    JOIN $(migrationSchema:name).varda_person vp ON vp.id = vc.henkilo_id
    CROSS JOIN $(migrationSchema:name).evaka_person ep
    WHERE upper(vp.etunimet) = upper(ep.first_name)
        AND upper(vp.sukunimi) = upper(ep.last_name)
        AND vp.syntyma_pvm = ep.date_of_birth
`;

// SPDX-FileCopyrightText: 2021-2022 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "../db/db";
import {
    baseQueryParameters,
    runQuery,
    wrapWithReturning
} from "../util/queryTools";

export const transformVarda = async (returnAll: boolean = false) => {
    return await migrationDb.tx(async (t) => {
        await runQuery(tableSql, t, false, baseQueryParameters);
        const result = await runQuery(
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
        await runQuery(todoSql, t, false, baseQueryParameters);
        return result;
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

    DROP TABLE IF EXISTS $(migrationSchema:name).evaka_varda_organizer_child_todo;
    CREATE TABLE $(migrationSchema:name).evaka_varda_organizer_child_todo (
        evaka_person_id UUID,
        varda_person_oid TEXT NOT NULL,
        varda_person_id BIGINT NOT NULL,
        varda_child_id BIGINT NOT NULL,
        organizer_oid TEXT NOT NULL,
        reason TEXT NOT NULL
    );
`;

const transformSql =
    `
    INSERT INTO $(migrationSchema:name).evaka_varda_organizer_child
        (evaka_person_id, varda_person_oid, varda_person_id, varda_child_id, organizer_oid)
    SELECT
        ep.id, vp.henkilo_oid, vp.id, vc.id, CASE
            WHEN vc.paos_kytkin THEN vc.paos_organisaatio_oid
            ELSE vc.vakatoimija_oid
        END
    FROM $(migrationSchema:name).varda_child vc
    JOIN $(migrationSchema:name).varda_person vp ON vp.id = vc.henkilo_id
    CROSS JOIN person ep
    WHERE (
        $(migrationSchema:name).normalize_text(vp.etunimet) =
        $(migrationSchema:name).normalize_text(ep.first_name)
      OR
        $(migrationSchema:name).normalize_text(ep.first_name) ilike
           '%' || $(migrationSchema:name).normalize_text(vp.kutsumanimi) || '%'
        )
      AND $(migrationSchema:name).normalize_text(ep.last_name) ilike
          '%' || $(migrationSchema:name).normalize_text(vp.sukunimi) || '%'
      AND vp.syntyma_pvm = ep.date_of_birth
    `;

const todoSql =
    `
    INSERT INTO $(migrationSchema:name).evaka_varda_organizer_child_todo
    SELECT a.*, 'AMBIGUOUS MATCH TO EVAKA PERSON' as reason
    FROM $(migrationSchema:name).evaka_varda_organizer_child a
    JOIN $(migrationSchema:name).evaka_varda_organizer_child b on a.evaka_person_id = b.evaka_person_id
        AND a.varda_person_id <> b.varda_person_id;

    INSERT INTO $(migrationSchema:name).evaka_varda_organizer_child_todo
    SELECT a.*, 'AMBIGUOUS MATCH TO VARDA PERSON' as reason
    FROM $(migrationSchema:name).evaka_varda_organizer_child a
    JOIN $(migrationSchema:name).evaka_varda_organizer_child b on a.varda_person_id = b.varda_person_id
        AND a.evaka_person_id IS NOT NULL
        AND b.evaka_person_id IS NOT NULL
        AND a.evaka_person_id <> b.evaka_person_id;

    DELETE FROM $(migrationSchema:name).evaka_varda_organizer_child a
    WHERE EXISTS (
        SELECT FROM $(migrationSchema:name).evaka_varda_organizer_child_todo b
        WHERE b.evaka_person_id = a.evaka_person_id
            AND b.varda_person_oid = a.varda_person_oid
            AND b.varda_person_id = a.varda_person_id
        );

    INSERT INTO $(migrationSchema:name).evaka_varda_organizer_child_todo
    SELECT null,
            vp.henkilo_oid,
            vp.id,
            vc.id,
            CASE
                WHEN vc.paos_kytkin THEN vc.paos_organisaatio_oid
                ELSE vc.vakatoimija_oid
                END,
            'MISSING EVAKA MATCH' as reason
    FROM $(migrationSchema:name).varda_person vp
                JOIN $(migrationSchema:name).varda_child vc ON vp.id = vc.henkilo_id
    WHERE NOT EXISTS(
            SELECT
            FROM $(migrationSchema:name).varda_person k
                        CROSS JOIN person ep
            WHERE (
                        $(migrationSchema:name).normalize_text(k.etunimet) =
                        $(migrationSchema:name).normalize_text(ep.first_name)
                    OR
                        $(migrationSchema:name).normalize_text(ep.first_name) ilike
                        '%' || $(migrationSchema:name).normalize_text(k.kutsumanimi) || '%'
                )
                AND $(migrationSchema:name).normalize_text(ep.last_name) ilike
                    '%' || $(migrationSchema:name).normalize_text(k.sukunimi) || '%'
                AND k.syntyma_pvm = ep.date_of_birth
                AND k.id = vp.id
    );
    `
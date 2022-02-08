// SPDX-FileCopyrightText: 2021-2022 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { config } from "../config";
import migrationDb, { pgp } from "../db/db";
import { baseQueryParameters } from "../util/queryTools";
import {
    VardaClient,
    VardaV1Children,
    VardaV1Person,
} from "../util/varda-client";

export const importVarda = async (vardaClient: VardaClient) => {
    await migrationDb.none(tableSql, baseQueryParameters);
    await importVardaChildData(vardaClient);
    return await importVardaPersonData(vardaClient);
};

const importVardaChildData = async (vardaClient: VardaClient) => {
    let children = await vardaClient.getChildren();
    const childrenCount = children.count;
    const pageCount = Math.ceil(childrenCount / children.results.length);
    console.log(`Children count=${childrenCount}, page count=${pageCount}`);
    let pageNumber = 1;
    while (true) {
        const insertSql = pgp.helpers.insert(children.results, childColumns);
        await migrationDb.none(insertSql);

        const nextUrl = children.next;
        if (nextUrl === null) {
            break;
        }

        if (++pageNumber % 50 === 0) {
            console.log(`Loading page ${pageNumber}`);
        }
        const data = await vardaClient.getByUrl<VardaV1Children>(nextUrl);
        if (data === null) {
            throw Error(`Next url '${nextUrl}' returned 404`);
        }
        children = data;
    }
};

export const importVardaPersonData = async (vardaClient: VardaClient) => {
    const data: Array<VardaChildRow> = [];

    const children = await migrationDb.manyOrNone<VardaChildRow>(
        selectSql,
        baseQueryParameters
    );
    let rowNumber = 0;
    for (const child of children) {
        if (rowNumber++ % 500 === 0) {
            console.log(`Loading person with row number ${rowNumber}`);
        }
        const { id: childId, henkilo: personUrl } = child;
        const person = await vardaClient.getByUrl<VardaV1Person>(personUrl);
        if (person === null) {
            console.warn(`Person url '${personUrl}' returned 404`);
            continue;
        }

        const updateSql =
            pgp.helpers.update(person, personColumns) +
            pgp.as.format(" WHERE id = ${id} RETURNING *", { id: childId });
        data.push(await migrationDb.one<VardaChildRow>(updateSql));
    }

    return data;
};

interface VardaChildRow {
    id: number;
    henkilo: string;
    henkilo_oid: string;
    vakatoimija_oid: string | null;
    paos_organisaatio_oid: string | null;
    paos_kytkin: boolean;
    henkilo_id: number;
    etunimet: string | null;
    kutsumanimi: string | null;
    sukunimi: string | null;
    syntyma_pvm: Date | null;
}

const tableSql = `
    CREATE TABLE IF NOT EXISTS $(migrationSchema:name).varda_child (
        id BIGINT PRIMARY KEY,
        henkilo TEXT NOT NULL,
        henkilo_oid TEXT NOT NULL,
        vakatoimija_oid TEXT,
        paos_organisaatio_oid TEXT,
        paos_kytkin BOOLEAN NOT NULL,
        henkilo_id BIGINT,
        etunimet TEXT,
        kutsumanimi TEXT,
        sukunimi TEXT,
        syntyma_pvm DATE,
        CHECK (vakatoimija_oid IS NOT NULL OR paos_organisaatio_oid IS NOT NULL)
    );
`;

const selectSql = `
    SELECT *
    FROM $(migrationSchema:name).varda_child
    WHERE henkilo_id IS NULL
    ORDER BY id;
`;

const childColumns = new pgp.helpers.ColumnSet(
    [
        "id",
        "henkilo",
        "henkilo_oid",
        "vakatoimija_oid",
        "paos_organisaatio_oid",
        "paos_kytkin",
    ],
    {
        table: {
            table: "varda_child",
            schema: config.migrationSchema,
        },
    }
);

const personColumns = new pgp.helpers.ColumnSet(
    [
        {
            name: "henkilo_id",
            prop: "id",
        },
        "etunimet",
        "kutsumanimi",
        "sukunimi",
        "syntyma_pvm",
    ],
    {
        table: {
            table: "varda_child",
            schema: config.migrationSchema,
        },
    }
);

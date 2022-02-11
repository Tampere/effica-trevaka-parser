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
        const results = children.results.map((result) => ({
            oma_organisaatio_nimi: null,
            paos_organisaatio_nimi: null,
            ...result,
        }));
        const insertSql = pgp.helpers.insert(results, childColumns);
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
    let data: Array<VardaChildRow & VardaPersonRow> = [];

    const personUrls = await migrationDb.map<string>(
        selectSql,
        baseQueryParameters,
        (row) => row.henkilo
    );
    let rowNumber = 0;
    for (const personUrl of personUrls) {
        if (rowNumber++ % 500 === 0) {
            console.log(`Loading person with row number ${rowNumber}`);
        }
        const personData = await vardaClient.getByUrl<VardaV1Person>(personUrl);
        if (personData === null) {
            console.warn(`Person url '${personUrl}' returned 404`);
            continue;
        }

        await migrationDb.tx(async (t) => {
            const insertSql =
                pgp.helpers.insert(personData, personColumns) +
                pgp.as.format(" RETURNING *");
            const person = await migrationDb.one<VardaPersonRow>(insertSql);

            const children = await migrationDb.many<VardaChildRow>(updateSql, {
                ...baseQueryParameters,
                personId: person.id,
                personUrl: person.url,
            });

            data = data.concat(
                children.map((child) => ({
                    ...person,
                    ...child,
                }))
            );
        });
    }

    return data;
};

interface VardaPersonRow {
    url: string;
    id: number;
    etunimet: string;
    kutsumanimi: string;
    sukunimi: string;
    henkilo_oid: string;
    syntyma_pvm: string;
    lapsi: string[];
    tyontekija: string[];
    turvakielto: boolean;
}

interface VardaChildRow {
    url: string;
    lahdejarjestelma: string;
    id: number;
    henkilo_id: number | null;
    henkilo: string;
    henkilo_oid: string;
    vakatoimija: string | null;
    vakatoimija_oid: string | null;
    oma_organisaatio_nimi: string | null;
    oma_organisaatio: string | null;
    oma_organisaatio_oid: string | null;
    paos_organisaatio_nimi: string | null;
    paos_organisaatio: string | null;
    paos_organisaatio_oid: string | null;
    paos_kytkin: boolean;
    varhaiskasvatuspaatokset_top: string[];
    tunniste: string | null;
    muutos_pvm: string | null;
}

const tableSql = `
    CREATE TABLE IF NOT EXISTS $(migrationSchema:name).varda_person (
        url TEXT NOT NULL,
        id BIGINT PRIMARY KEY,
        etunimet TEXT NOT NULL,
        kutsumanimi TEXT NOT NULL,
        sukunimi TEXT NOT NULL,
        henkilo_oid TEXT NOT NULL,
        syntyma_pvm DATE NOT NULL,
        lapsi TEXT[] NOT NULL,
        tyontekija TEXT[] NOT NULL,
        turvakielto BOOLEAN NOT NULL
    );

    CREATE TABLE IF NOT EXISTS $(migrationSchema:name).varda_child (
        url TEXT NOT NULL,
        lahdejarjestelma TEXT NOT NULL,
        id BIGINT PRIMARY KEY,
        henkilo_id BIGINT REFERENCES $(migrationSchema:name).varda_person,
        henkilo TEXT NOT NULL,
        henkilo_oid TEXT NOT NULL,
        vakatoimija TEXT,
        vakatoimija_oid TEXT,
        oma_organisaatio_nimi TEXT,
        oma_organisaatio TEXT,
        oma_organisaatio_oid TEXT,
        paos_organisaatio_nimi TEXT,
        paos_organisaatio TEXT,
        paos_organisaatio_oid TEXT,
        paos_kytkin BOOLEAN NOT NULL,
        varhaiskasvatuspaatokset_top TEXT[] NOT NULL,
        tunniste TEXT,
        muutos_pvm TEXT
        CHECK (vakatoimija_oid IS NOT NULL OR paos_organisaatio_oid IS NOT NULL)
    );
`;

const selectSql = `
    SELECT DISTINCT henkilo
    FROM $(migrationSchema:name).varda_child
    WHERE henkilo_id IS NULL
    ORDER BY henkilo;
`;

const updateSql = `
    UPDATE $(migrationSchema:name).varda_child
    SET henkilo_id = $(personId)
    WHERE henkilo = $(personUrl)
    RETURNING *;
`;

const childColumns = new pgp.helpers.ColumnSet(
    [
        "url",
        "lahdejarjestelma",
        "id",
        "henkilo",
        "henkilo_oid",
        "vakatoimija",
        "vakatoimija_oid",
        "oma_organisaatio_nimi",
        "oma_organisaatio",
        "oma_organisaatio_oid",
        "paos_organisaatio_nimi",
        "paos_organisaatio",
        "paos_organisaatio_oid",
        "paos_kytkin",
        "varhaiskasvatuspaatokset_top",
        "tunniste",
        "muutos_pvm",
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
        "url",
        "id",
        "etunimet",
        "kutsumanimi",
        "sukunimi",
        "henkilo_oid",
        "syntyma_pvm",
        "lapsi",
        "tyontekija",
        "turvakielto",
    ],
    {
        table: {
            table: "varda_person",
            schema: config.migrationSchema,
        },
    }
);

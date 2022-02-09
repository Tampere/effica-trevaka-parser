// SPDX-FileCopyrightText: 2021-2022 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import db from "../src/db/db";
import { importVarda } from "../src/import/varda";
import { initDb } from "../src/init";
import { transferVarda } from "../src/transfer/varda";
import { transformVarda } from "../src/transform/varda";
import { dropTable, truncateEvakaTables } from "../src/util/queryTools";
import {
    setupTable,
    setupTransfer,
    setupTransformation,
} from "../src/util/testTools";
import {
    VardaClient,
    VardaV1Children,
    VardaV1Person,
} from "../src/util/varda-client";

beforeAll(async () => {
    await initDb();
});

beforeEach(async () => {
    await setupTable("persons");
    await setupTable("codes");
    await setupTransformation("persons");
    await setupTransfer("persons");
    await dropTable("varda_child");
    await dropTable("varda_person");
    await truncateEvakaTables(["varda_organizer_child", "person"]);
});

afterAll(async () => {
    await db.$pool.end();
});

it("should import, transform and transfer varda data", async () => {
    const mockDataByUrl: Record<string, VardaV1Children | VardaV1Person> = {
        "localhost//v1/lapset": {
            count: 3,
            next: "localhost//v1/lapset?page=2",
            previous: null,
            results: [
                {
                    url: "localhost/lapsi/11",
                    lahdejarjestelma: "93",
                    id: 11,
                    henkilo: "localhost/henkilo/21",
                    henkilo_oid: "1.1.1.1",
                    vakatoimija: null,
                    vakatoimija_oid: "2.2.2.1",
                    oma_organisaatio: null,
                    oma_organisaatio_oid: null,
                    paos_organisaatio: null,
                    paos_organisaatio_oid: null,
                    paos_kytkin: false,
                    varhaiskasvatuspaatokset_top: [],
                    tunniste: null,
                    muutos_pvm: new Date().toISOString(),
                },
                {
                    url: "localhost/lapsi/12",
                    lahdejarjestelma: "45",
                    id: 12,
                    henkilo: "localhost/henkilo/22",
                    henkilo_oid: "1.1.1.2",
                    vakatoimija: null,
                    vakatoimija_oid: null,
                    oma_organisaatio: null,
                    oma_organisaatio_oid: null,
                    paos_organisaatio: null,
                    paos_organisaatio_oid: "2.2.2.2",
                    paos_kytkin: true,
                    varhaiskasvatuspaatokset_top: [],
                    tunniste: null,
                    muutos_pvm: new Date().toISOString(),
                },
            ],
        },
        "localhost//v1/lapset?page=2": {
            count: 3,
            next: null,
            previous: "localhost//v1/lapset",
            results: [
                {
                    url: "localhost/lapsi/13",
                    lahdejarjestelma: "57",
                    id: 13,
                    henkilo: "localhost/henkilo/21",
                    henkilo_oid: "1.1.1.1",
                    vakatoimija: null,
                    vakatoimija_oid: "2.2.2.3",
                    oma_organisaatio: null,
                    oma_organisaatio_oid: null,
                    paos_organisaatio: null,
                    paos_organisaatio_oid: null,
                    paos_kytkin: false,
                    varhaiskasvatuspaatokset_top: [],
                    tunniste: null,
                    muutos_pvm: new Date().toISOString(),
                },
            ],
        },
        "localhost/henkilo/21": {
            url: "localhost/henkilo/21",
            id: 21,
            etunimet: "Christian",
            kutsumanimi: "Christian",
            sukunimi: "Child",
            henkilo_oid: "1.1.1.1",
            syntyma_pvm: "2019-06-01",
            lapsi: ["localhost/lapsi/11", "localhost/lapsi/13"],
            tyontekija: [],
            turvakielto: false,
        },
        "localhost/henkilo/22": {
            url: "localhost/henkilo/22",
            id: 22,
            etunimet: "Camilla",
            kutsumanimi: "Camilla",
            sukunimi: "Child",
            henkilo_oid: "1.1.1.2",
            syntyma_pvm: "2018-11-25",
            lapsi: ["localhost/lapsi/12"],
            tyontekija: [],
            turvakielto: false,
        },
    };
    const client: VardaClient = {
        //@ts-ignore
        getChildren: jest.fn(() => mockDataByUrl["localhost//v1/lapset"]),
        //@ts-ignore
        getByUrl: jest.fn((url) => {
            const mockData = mockDataByUrl[url];
            if (mockData === undefined) {
                return Promise.reject("404");
            }
            return Promise.resolve(mockData);
        }),
    };

    const importData = await importVarda(client);
    expect(importData).toMatchSnapshot();

    const transformData = await transformVarda(true);
    expect(transformData).toMatchSnapshot(Array(3).fill(transformExpectation));

    const transferData = await transferVarda(true);
    expect(transferData).toMatchSnapshot(Array(3).fill(transferExpectation));
});

const transformExpectation = {
    evaka_person_id: expect.any(String),
};

const transferExpectation = {
    created_at: expect.any(Date),
    modified_at: expect.any(Date),
    evaka_person_id: expect.any(String),
};

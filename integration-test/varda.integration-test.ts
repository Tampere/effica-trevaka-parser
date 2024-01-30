// SPDX-FileCopyrightText: 2021-2022 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import db from "../src/db/db";
import { importVarda, importVardaUnitData } from "../src/import/varda";
import { initDb } from "../src/init";
import { transferVarda } from "../src/transfer/varda";
import { transformVarda } from "../src/transform/varda";
import {
    cleanupDb,
    setupTable,
    setupTransfer,
    setupTransformation
} from "../src/util/testTools";
import {
    VardaClient,
    VardaV1Child,
    VardaV1Page,
    VardaV1Person,
    VardaV1Unit
} from "../src/util/varda-client";
import migrationDb from "../src/db/db";

beforeAll(async () => {
    await migrationDb.tx(async (tx) => await initDb(tx));
});

beforeEach(async () => {
    await db.tx(tx => cleanupDb(tx));
    await setupTable("persons");
    await setupTable("codes");
    await setupTransformation("persons");
    await setupTransfer("persons");
});

afterAll(async () => {
    await db.$pool.end();
});

it("should import varda unit data", async () => {
    const mockDataByUrl: Record<string, VardaV1Page<VardaV1Unit>> = {
        "localhost/v1/toimipaikat": {
            count: 3,
            next: "localhost/v1/toimipaikat?page=2",
            previous: null,
            results: [
                {
                    url: "localhost/toimipaikka/11",
                    lahdejarjestelma: "93",
                    id: 11,
                    vakajarjestaja: "localhost/organisaatio/2.2.2.1",
                    vakajarjestaja_oid: "2.2.2.1",
                    organisaatio_oid: "",
                    nimi: "Toimipaikka 1",
                    alkamis_pvm: "2022-01-01",
                    paattymis_pvm: null,
                    hallinnointijarjestelma: "VARDA",
                    tunniste: "tunniste1",
                    muutos_pvm: "2022-02-09T11:29:00.249Z",
                },
                {
                    url: "localhost/toimipaikka/12",
                    lahdejarjestelma: "45",
                    id: 12,
                    vakajarjestaja: "localhost/organisaatio/2.2.2.4",
                    vakajarjestaja_oid: "2.2.2.4",
                    organisaatio_oid: "",
                    nimi: "Toimipaikka 2",
                    alkamis_pvm: "2020-01-01",
                    paattymis_pvm: "2020-12-31",
                    hallinnointijarjestelma: "VARDA",
                    tunniste: "tunniste2",
                    muutos_pvm: "2022-02-09T11:29:00.249Z",
                },
            ],
        },
        "localhost/v1/toimipaikat?page=2": {
            count: 3,
            next: null,
            previous: "localhost/v1/toimipaikat",
            results: [
                {
                    url: "localhost/toimipaikka/13",
                    lahdejarjestelma: "57",
                    id: 13,
                    vakajarjestaja: "localhost/organisaatio/2.2.2.3",
                    vakajarjestaja_oid: "2.2.2.3",
                    organisaatio_oid: "",
                    nimi: "Toimipaikka 3",
                    alkamis_pvm: "2021-01-01",
                    paattymis_pvm: null,
                    hallinnointijarjestelma: "VARDA",
                    tunniste: "tunniste3",
                    muutos_pvm: "2022-02-09T11:29:00.249Z",
                },
            ],
        },
    };
    const client: VardaClient = {
        //@ts-ignore
        getUnits: jest.fn(() => mockDataByUrl["localhost/v1/toimipaikat"]),
        //@ts-ignore
        getByUrl: jest.fn((url) => {
            const mockData = mockDataByUrl[url];
            if (mockData === undefined) {
                return Promise.reject("404");
            }
            return Promise.resolve(mockData);
        }),
    };

    const importData = await importVardaUnitData(client);
    expect(importData).toMatchSnapshot();
});

it("should import, transform and transfer varda data", async () => {
    const mockDataByUrl: Record<
        string,
        VardaV1Page<VardaV1Child> | VardaV1Person
    > = {
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
                    vakatoimija: "localhost/organisaatio/2.2.2.1",
                    vakatoimija_oid: "2.2.2.1",
                    oma_organisaatio: null,
                    oma_organisaatio_oid: null,
                    paos_organisaatio: null,
                    paos_organisaatio_oid: null,
                    paos_kytkin: false,
                    varhaiskasvatuspaatokset_top: [
                        "localhost/paatos/1",
                        "localhost/paatos/2",
                    ],
                    tunniste: "tunniste1",
                    muutos_pvm: "2022-02-09T11:29:00.249Z",
                },
                {
                    url: "localhost/lapsi/12",
                    lahdejarjestelma: "45",
                    id: 12,
                    henkilo: "localhost/henkilo/22",
                    henkilo_oid: "1.1.1.2",
                    vakatoimija: null,
                    vakatoimija_oid: null,
                    oma_organisaatio_nimi: "Kaupunki 1",
                    oma_organisaatio: "localhost/organisaatio/2.2.2.4",
                    oma_organisaatio_oid: "2.2.2.4",
                    paos_organisaatio_nimi: "Perhepäivähoitaja 1",
                    paos_organisaatio: "localhost/organisaatio/2.2.2.2",
                    paos_organisaatio_oid: "2.2.2.2",
                    paos_kytkin: true,
                    varhaiskasvatuspaatokset_top: ["localhost/paatos/3"],
                    tunniste: null,
                    muutos_pvm: "2022-02-09T11:29:00.249Z",
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
                    vakatoimija: "localhost/organisaatio/2.2.2.3",
                    vakatoimija_oid: "2.2.2.3",
                    oma_organisaatio: null,
                    oma_organisaatio_oid: null,
                    paos_organisaatio: null,
                    paos_organisaatio_oid: null,
                    paos_kytkin: false,
                    varhaiskasvatuspaatokset_top: [],
                    tunniste: "tunniste2",
                    muutos_pvm: "2022-02-09T11:29:47.317Z",
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
            tyontekija: ["localhost/tyontekija/1"],
            turvakielto: true,
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
    row_id: expect.any(String),
};

const transferExpectation = {
    created_at: expect.any(Date),
    modified_at: expect.any(Date),
    evaka_person_id: expect.any(String),
};

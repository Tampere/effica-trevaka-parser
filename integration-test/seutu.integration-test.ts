// SPDX-FileCopyrightText: 2023-2024 Tampere region
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { initDb } from "../src/init";
import { config as configFromEnv } from "../src/config";
import { pgp } from "../src/db/db";
import { cleanupDb } from "../src/util/testTools";
import {
    AREA_COLUMN_SET, findTransferFridge,
    findTransferIncomes,
    imports,
    transfers,
    transforms,
    UNIT_COLUMN_SET
} from "./test-utils";

const config = {
    ...configFromEnv,
    cityVariant: "seutu",
    migrationDb: { ...configFromEnv.migrationDb, database: "evaka_local" },
};
const db = pgp(config.migrationDb);

beforeAll(() => db.tx(initDb));
beforeEach(() => db.tx((tx) => cleanupDb(tx, true)));
afterAll(db.$pool.end);
const importBasePath = `${__dirname}/data/sem/seutu`;

describe("seutu", () => {
    beforeEach(async () => {
        await db.none(pgp.helpers.insert(areas, AREA_COLUMN_SET));
        await db.none(pgp.helpers.insert(units, UNIT_COLUMN_SET));
    });

    it("pre", async () => {
        await imports(
            db,
            {
                path: `${importBasePath}/pre-test/person`,
                importTarget: "effica_person",
            },
            {
                path: `${importBasePath}/pre-test/fridge/child`,
                importTarget: "effica_fridge_child",
            },
            {
                path: `${importBasePath}/pre-test/placement`,
                importTarget: "effica_placement",
            },
            {
                path: `${importBasePath}/pre-test/income`,
                importTarget: "effica_income",
            },
        );
        await transforms(db, config, "pre-1", "pre-2");
        await transfers(db, "pre-1", "pre-2");
    });

    it("fridge", async () => {
        await imports(
            db,
            {
                path: `${importBasePath}/fridge-test/person`,
                importTarget: "effica_person",
            },
            {
                path: `${importBasePath}/fridge-test/fridge/child`,
                importTarget: "effica_fridge_child",
            },
            {
                path: `${importBasePath}/fridge-test/income`,
                importTarget: "effica_income",
            },
        );
        await transforms(db, config, "person", "fridge");
        await transfers(db, "person", "fridge");
        expect(await db.tx(findTransferFridge)).toMatchSnapshot();
    });

    it("income", async () => {
        await imports(
            db,
            {
                path: `${importBasePath}/income-test/person`,
                importTarget: "effica_person",
            },
            {
                path: `${importBasePath}/income-test/income`,
                importTarget: "effica_income",
            },
        );
        await transforms(db, config, "person", "income");
        await transfers(db, "person", "income");
        expect(await db.tx(findTransferIncomes)).toMatchSnapshot();
    });

    it("post", async () => {
        await imports(
            db,
            {
                path: `${importBasePath}/post-test/person`,
                importTarget: "effica_person",
            },
            {
                path: `${importBasePath}/post-test/fridge/child`,
                importTarget: "effica_fridge_child",
            },
            {
                path: `${importBasePath}/post-test/income`,
                importTarget: "effica_income",
            },
        );
        await transforms(db, config, "person", "fridge");
        await transforms(db, config, "post");
        await transfers(db, "post");
    });
});

const areas = [
    {
        id: "d297bf95-dea7-4e9a-8ecb-5d6c9a85b850",
        name: "Alue A",
    },
];

const units = [
    {
        id: "fcba1717-ea3d-4611-8ea5-32669d630ee9",
        name: "Päiväkoti A",
        care_area_id: "d297bf95-dea7-4e9a-8ecb-5d6c9a85b850",
        provider_type: "MUNICIPAL",
    },
    {
        id: "794ae905-982d-42aa-93d1-2dfa6b9938b7",
        name: "Päiväkoti B",
        care_area_id: "d297bf95-dea7-4e9a-8ecb-5d6c9a85b850",
        provider_type: "MUNICIPAL",
    },
];

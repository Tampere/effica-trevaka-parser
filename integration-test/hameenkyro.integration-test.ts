// SPDX-FileCopyrightText: 2023-2024 Tampere region
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { initDb } from "../src/init";
import { config as configFromEnv } from "../src/config";
import { pgp } from "../src/db/db";
import { cleanupDb } from "../src/util/testTools";
import {
    findPlacementMappings,
    findTransferPlacements,
    findTransformPlacements,
    imports,
    transfers,
    transforms,
    UNIT_COLUMN_SET,
} from "./test-utils";

const config = {
    ...configFromEnv,
    cityVariant: "hameenkyro",
    migrationDb: { ...configFromEnv.migrationDb, database: "hameenkyro" },
};
const db = pgp(config.migrationDb);
const importBasePath = `${__dirname}/data/sem/hameenkyro`;

beforeAll(() => db.tx(initDb));
beforeEach(() => db.tx(cleanupDb));
afterAll(db.$pool.end);

describe("hameenkyro", () => {
    beforeEach(async () => {
        await db.none(pgp.helpers.insert(units, UNIT_COLUMN_SET));
    });

    it("all placement mappings exists", async () => {
        const mappings = await db.tx((tx) =>
            findPlacementMappings(tx, config.cityVariant),
        );
        expect(mappings).toMatchSnapshot();
    });

    it("placement preschool", async () => {
        await imports(
            db,
            {
                path: `${importBasePath}/preschool-test/departments`,
                importTarget: "effica_department",
            },
            {
                path: `${importBasePath}/preschool-test/persons`,
                importTarget: "effica_person",
            },
            {
                path: `${importBasePath}/preschool-test/placements`,
                importTarget: "effica_placement",
            },
        );

        await transforms(db, config, "department", "person", "placement");
        expect(await db.tx(findTransformPlacements)).toMatchSnapshot();

        await transfers(db, "department", "person", "placement");
        expect(await db.tx(findTransferPlacements)).toMatchSnapshot();
    });

    it("placement preschool daycare", async () => {
        await imports(
            db,
            {
                path: `${importBasePath}/preschool-daycare-test/departments`,
                importTarget: "effica_department",
            },
            {
                path: `${importBasePath}/preschool-daycare-test/persons`,
                importTarget: "effica_person",
            },
            {
                path: `${importBasePath}/preschool-daycare-test/placements`,
                importTarget: "effica_placement",
            },
        );

        await transforms(db, config, "department", "person", "placement");
        expect(await db.tx(findTransformPlacements)).toMatchSnapshot();

        await transfers(db, "department", "person", "placement");
        expect(await db.tx(findTransferPlacements)).toMatchSnapshot();
    });

    it("placement private voucher service", async () => {
        await imports(
            db,
            {
                path: `${importBasePath}/voucher-placement-test/departments`,
                importTarget: "effica_department",
            },
            {
                path: `${importBasePath}/voucher-placement-test/persons`,
                importTarget: "effica_person",
            },
            {
                path: `${importBasePath}/voucher-placement-test/placements`,
                importTarget: "effica_placement",
            },
        );

        await transforms(db, config, "department", "person", "placement");
        expect(await db.tx(findTransformPlacements)).toMatchSnapshot();

        await transfers(db, "department", "person", "placement");
        expect(await db.tx(findTransferPlacements)).toMatchSnapshot();
    });
});

const units = [
    {
        id: "92b6e496-d273-11ee-9265-db72361ab90d",
        name: "Kunnallinen A",
        care_area_id: "b2402306-f415-4430-989c-16032490cc1b",
        provider_type: "MUNICIPAL",
    },
    {
        id: "ccf269c5-8677-452c-b2b7-e476a031f7b0",
        name: "Palveluseteli A",
        care_area_id: "b2402306-f415-4430-989c-16032490cc1b",
        provider_type: "PRIVATE_SERVICE_VOUCHER",
    },
];

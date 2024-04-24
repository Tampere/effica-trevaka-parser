// SPDX-FileCopyrightText: 2023-2024 Tampere region
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { initDb } from "../src/init";
import { config as configFromEnv } from "../src/config";
import { pgp } from "../src/db/db";
import { cleanupDb } from "../src/util/testTools";
import { findPlacementMappings } from "./test-utils";

const config = {
    ...configFromEnv,
    cityVariant: "ylojarvi",
    migrationDb: {
        ...configFromEnv.migrationDb,
        database: "evaka_ylojarvi_local",
    },
};
const db = pgp(config.migrationDb);

beforeAll(() => db.tx(initDb));
beforeEach(() => db.tx(cleanupDb));
afterAll(db.$pool.end);

describe("ylojarvi", () => {
    it("all placement mappings exists", async () => {
        const mappings = await db.tx((tx) =>
            findPlacementMappings(tx, config.cityVariant),
        );
        expect(mappings).toMatchSnapshot();
    });
});

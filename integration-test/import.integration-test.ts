import request from "supertest";
import app from "../src/app";
import db from "../src/db/db";
import { errorCodes } from "../src/util";

const baseUrl = "/import";

let tableToReset: string | undefined = undefined;
const tables = ["person", "codes", "income", "incomerows", "families"];

beforeAll(() => { });

beforeEach(() => tableToReset = undefined)
afterEach(() => {
    if (tableToReset && tables.includes(tableToReset)) {
        return db.query(`DROP TABLE IF EXISTS ${tableToReset};`);
    }
});

afterAll(() => {
    return db.$pool.end();
});

// POSITIVE CASES
describe("GET /import positive", () => {
    it("should return created persons", async () => {
        const queryObject = {
            path: "/integration-test/data/person",
            returnAll: "true",
        };

        const response = await request(app).get(baseUrl).query(queryObject);
        expect(response.status).toBe(200);
        expect(response.body).toMatchSnapshot();
        tableToReset = "person";
        return response;
    });
    it("should return created families", async () => {
        const queryObject = {
            path: "/integration-test/data/families",
            returnAll: "true",
        };

        const response = await request(app).get(baseUrl).query(queryObject);
        expect(response.status).toBe(200);
        expect(response.body).toMatchSnapshot(familiesResult);
        tableToReset = "families";
        return response;
    });

    it("should return created codes", async () => {
        const queryObject = {
            path: "/integration-test/data/codes",
            returnAll: "true",
        };

        const response = await request(app).get(baseUrl).query(queryObject);
        expect(response.status).toBe(200);
        expect(response.body).toMatchSnapshot();


        tableToReset = "codes";
        return response;
    });

    it("should return created income ", async () => {
        const queryObject = {
            path: "/integration-test/data/income",
            returnAll: "true",
        };

        const response = await request(app).get(baseUrl).query(queryObject);
        expect(response.status).toBe(200);
        expect(response.body).toMatchSnapshot(incomeResult);

        tableToReset = "income";
        return response;
    });

    it("should return created incomerows", async () => {
        const queryObject = {
            path: "/integration-test/data/incomerows",
            returnAll: "true",
        };

        const response = await request(app).get(baseUrl).query(queryObject);
        expect(response.status).toBe(200);
        expect(response.body).toMatchSnapshot(incomeRowsResult);

        tableToReset = "incomerows";
        return response;
    });

    it("should work even if XML elements have mixed case", async () => {
        const queryObject = {
            path: "/integration-test/data/mixedcase",
            returnAll: "true",
        };

        const response = await request(app).get(baseUrl).query(queryObject);
        expect(response.status).toBe(200);
        expect(response.body).toMatchSnapshot();

        tableToReset = "codes";
        return response;
    })
})


// NEGATIVE CASES
describe("GET /import negative", () => {
    it("should fail on non flat data", async () => {
        const queryObject = {
            path: "/integration-test/data/error/nonflat",
            returnAll: "true",
        };

        const response = await request(app).get(baseUrl).query(queryObject);
        expect(response.status).toBe(500);
        expect(response.text).toContain(errorCodes.nonFlatData)

        return response;
    });

    it("should fail on non mapped table", async () => {
        const queryObject = {
            path: "/integration-test/data/error/unknowntable",
            returnAll: "true",
        };

        const response = await request(app).get(baseUrl).query(queryObject);
        expect(response.status).toBe(500);
        expect(response.text).toContain(errorCodes.nonMappedTable)

        return response;
    });

    it("should fail on non mapped column", async () => {
        const queryObject = {
            path: "/integration-test/data/error/unknowncolumn",
            returnAll: "true",
        };

        const response = await request(app).get(baseUrl).query(queryObject);
        expect(response.status).toBe(500);
        expect(response.text).toContain(errorCodes.nonMappedColumn)

        return response;
    });

    it("should fail on no data content", async () => {
        const queryObject = {
            path: "/integration-test/data/error/empty",
            returnAll: "true",
        };

        const response = await request(app).get(baseUrl).query(queryObject);
        expect(response.status).toBe(500);
        expect(response.text).toContain(errorCodes.noDataContent)

        return response;
    });

    it("should fail on ambiguous data content", async () => {
        const queryObject = {
            path: "/integration-test/data/error/ambiguous",
            returnAll: "true",
        };

        const response = await request(app).get(baseUrl).query(queryObject);
        expect(response.status).toBe(500);
        expect(response.text).toContain(errorCodes.ambiguousTableData)

        return response;
    });
});

const familiesResult = {
    "inserts":
        [
            [
                {
                    "startdate": expect.any(String),
                    "enddate": expect.any(String)
                },

                {
                    "startdate": expect.any(String),
                    "enddate": expect.any(String)
                },

                {
                    "startdate": expect.any(String),
                    "enddate": expect.any(String)
                },

                {
                    "startdate": expect.any(String),
                },
                {
                    "startdate": expect.any(String),
                }
            ]
        ]
}
const incomeResult = {
    "inserts":
        [
            [
                {
                    "startdate": expect.any(String),
                    "enddate": expect.any(String)
                },
                {
                    "startdate": expect.any(String),
                    "enddate": expect.any(String)
                }
            ]
        ]
}
const incomeRowsResult = {
    "inserts":
        [
            [
                {
                    "startdate": expect.any(String),
                    "enddate": expect.any(String)
                },
                {
                    "startdate": expect.any(String),
                    "enddate": expect.any(String)
                }
            ]
        ]
}

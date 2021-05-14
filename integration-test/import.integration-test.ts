import request from "supertest";
import app from "../src/app";
import db from "../src/db/db";
import { errorCodes } from "../src/util"

const baseUrl = "/import";

let tableToReset: string | undefined = undefined;
const tables = ["persons", "codes", "income", "incomerows", "families"];

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
            path: "/integration-test/data/persons",
            returnAll: "true",
        };

        const response = await request(app).get(baseUrl).query(queryObject);
        expect(response.status).toBe(200);
        expect(response.body).toMatchSnapshot(personsResult);
        tableToReset = "persons";
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
        expect(response.body).toMatchSnapshot(
            codesResult
        );

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
        expect(response.body).toMatchSnapshot(
            mixedCaseResult
        );

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

const mixedCaseResult = {
    tables: ["codes"],
    inserts: [
        [
            {
                code: "1",
                active: true,
                codetype: "SPRAK",
                text: "Suomi¤¤Finska",
                extrainfo1: "fi",
                extrainfo2: null,
            },
            {
                code: "2",
                active: true,
                codetype: "HEMKOMMUN",
                text: "Ypäjä",
                extrainfo1: null,
                extrainfo2: null,
            },
            {
                code: "3",
                active: true,
                codetype: "LAND",
                text: "Suomi",
                extrainfo1: "FI",
                extrainfo2: "246",
            },
            {
                code: "26",
                active: true,
                codetype: "INKSLAG",
                text: "Lisätulo¤¤Inkomstslag1",
                extrainfo1: null,
                extrainfo2: null,
            },
            {
                code: "25",
                active: true,
                codetype: "INKSLAG",
                text: "Päätulo¤¤Inkomstslag2",
                extrainfo1: null,
                extrainfo2: null,
            },
            {
                code: "30",
                active: true,
                codetype: "INKPERIOD",
                text: "Kuukausitulo¤¤Inkomstperiod1",
                extrainfo1: null,
                extrainfo2: null,
            },
        ],
    ],
};

const personsResult = {
    tables: ["persons"],
    inserts: [
        [
            {
                personid: "020967-9992",
                personname: "Authentic, Aimo",
                secretaddress: false,
                personstreetaddress: "Fakestreet 123",
                personcity: "Ypäjä",
                personzipcode: "1",
                personhomeemail: "fake@notmaildomain.notext",
                personmobilephone: "000-0000000",
                mothertongue: 1,
                nationality: 3,
                homemunicipality: 2,
            },
            {
                personid: "020288-TP01",
                personname: "Temporary, Teppo",
                secretaddress: false,
                personstreetaddress: "StreetStreet 321",
                personcity: "Ypäjä",
                personzipcode: "2",
                personhomeemail: "fake2@notmaildomain.notext",
                personmobilephone: "111-1111111",
                mothertongue: 1,
                nationality: 3,
                homemunicipality: 2,
            },
            {
                personid: "180476-998M",
                personname: "Hidden, Hilda",
                secretaddress: true,
                personstreetaddress: "HideStreet 2",
                personcity: "Ypäjä",
                personzipcode: "1",
                personhomeemail: "fake3@notmaildomain.notext",
                personmobilephone: "222-2222222",
                mothertongue: 1,
                nationality: 3,
                homemunicipality: 2,
            },
            {
                personid: "010619A9501",
                personname: "Child, Christian",
                secretaddress: false,
                personstreetaddress: "HideStreet 2",
                personcity: "Ypäjä",
                personzipcode: "1",
                personhomeemail: "fake3@notmaildomain.notext",
                personmobilephone: "222-2222222",
                mothertongue: 1,
                nationality: 3,
                homemunicipality: 2,
            },
        ],
    ],
};
const familiesResult = {
    tables: ["families"],
    inserts: [
        [
            {
                familynbr: 1,
                personid: "020967-9992",
                startdate: "2015-02-01T22:00:00.000Z",
                enddate: "2019-05-30T21:00:00.000Z",
                roleinfamily: "R",
            },
            {
                familynbr: 1,
                personid: "180476-998M",
                startdate: "2015-02-01T22:00:00.000Z",
                enddate: "2019-05-30T21:00:00.000Z",
                roleinfamily: "S",
            },
            {
                familynbr: 2,
                personid: "020967-9992",
                startdate: "2019-05-31T21:00:00.000Z",
                enddate: null,
                roleinfamily: "R",
            },
            {
                familynbr: 2,
                personid: "180476-998M",
                startdate: "2019-05-31T21:00:00.000Z",
                enddate: null,
                roleinfamily: "S",
            },
            {
                familynbr: 2,
                personid: "010619A9501",
                startdate: "2019-05-31T21:00:00.000Z",
                enddate: null,
                roleinfamily: "B",
            },
        ],
    ],
};
const codesResult = {
    tables: ["codes"],
    inserts: [
        [
            {
                code: "1",
                active: true,
                codetype: "SPRAK",
                text: "Suomi¤¤Finska",
                extrainfo1: "fi",
                extrainfo2: null,
            },
            {
                code: "2",
                active: true,
                codetype: "HEMKOMMUN",
                text: "Ypäjä",
                extrainfo1: null,
                extrainfo2: null,
            },
            {
                code: "3",
                active: true,
                codetype: "LAND",
                text: "Suomi",
                extrainfo1: "FI",
                extrainfo2: "246",
            },
            {
                code: "26",
                active: true,
                codetype: "INKSLAG",
                text: "Lisätulo¤¤Inkomstslag1",
                extrainfo1: null,
                extrainfo2: null,
            },
            {
                code: "25",
                active: true,
                codetype: "INKSLAG",
                text: "Päätulo¤¤Inkomstslag2",
                extrainfo1: null,
                extrainfo2: null,
            },
            {
                code: "30",
                active: true,
                codetype: "INKPERIOD",
                text: "Kuukausitulo¤¤Inkomstperiod1",
                extrainfo1: null,
                extrainfo2: null,
            },
        ],
    ],
};
const incomeResult = {
    tables: ["income"],
    inserts: [
        [
            {
                personid: "180476-998M",
                startdate: "2020-01-02T22:00:00.000Z",
                enddate: "2021-01-02T22:00:00.000Z",
                maxincome: false,
                incomemissing: false,
                summa: "50000",
            },
            {
                personid: "020967-9992",
                startdate: "2020-01-02T22:00:00.000Z",
                enddate: "2021-01-02T22:00:00.000Z",
                maxincome: false,
                incomemissing: false,
                summa: "5060.6",
            },
        ],
    ],
};
const incomeRowsResult = {
    tables: ["incomerows"],
    inserts: [
        [
            {
                personid: "020967-9992",
                startdate: "2020-12-31T22:00:00.000Z",
                enddate: "2021-01-01T22:00:00.000Z",
                incomeperiod: 30,
                incometype: 25,
                summa: "4500.6",
            },
            {
                personid: "020967-9992",
                startdate: "2020-12-31T22:00:00.000Z",
                enddate: "2021-01-01T22:00:00.000Z",
                incomeperiod: 30,
                incometype: 26,
                summa: "560",
            },
        ],
    ],
};
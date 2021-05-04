import request from "supertest";
import app from "../src/app";
import db from "../src/db/db";

const baseUrl = "/import";

let table: string | undefined = undefined;
const tables = ["persons", "codes", "income", "incomerows", "families"];

beforeAll(() => { });

afterEach(() => {
    if (table && tables.includes(table)) {
        return db.query(`DROP TABLE ${table};`);
    }
});

afterAll(() => {
    return db.$pool.end();
});

describe("GET /import", () => {
    it("should return created persons", async () => {
        const queryObject = {
            path: "/integration-test/data/persons",
            returnAll: "true",
        };

        const response = await request(app).get(baseUrl).query(queryObject);
        expect(response.status).toBe(200);
        expect(response.body).toMatchSnapshot(personsResult);
        table = "persons";
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
        table = "families";
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

        table = "codes";
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

        table = "income";
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

        table = "incomerows";
        return response;
    });

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
                    extrainfo2: "",
                },
                {
                    code: "2",
                    active: true,
                    codetype: "HEMKOMMUN",
                    text: "Ypäjä",
                    extrainfo1: "",
                    extrainfo2: "",
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
                    extrainfo1: "",
                    extrainfo2: "",
                },
                {
                    code: "25",
                    active: true,
                    codetype: "INKSLAG",
                    text: "Päätulo¤¤Inkomstslag2",
                    extrainfo1: "",
                    extrainfo2: "",
                },
                {
                    code: "30",
                    active: true,
                    codetype: "INKPERIOD",
                    text: "Kuukausitulo¤¤Inkomstperiod1",
                    extrainfo1: "",
                    extrainfo2: "",
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
});

import request from "supertest"
import app from "../src/app"
import db from "../src/db/db"
import { dropTable, truncateEvakaTable } from "../src/util/queryTools"
import { setupTable, setupTransformations } from "../src/util/testTools"

const baseUrl = "/transfer"

//order based on dependency
const baseDataTables =
    [
        "person",
        "codes",
        "families",
        "units",
        "departments",
        "unitmap",
        "childmindermap",
        "income",
        "incomerows",
        "evaka_areas",
        "evaka_daycare"
    ]

//endpoint: table
const transformationMap: Record<string, string> = {
    person: "evaka_person"
}

let evakaDataCleanups: string[] = [

]

const personExpectation = {
    id: expect.any(String),
    date_of_birth: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
    updated_from_vtj: expect.any(String)
}

beforeAll(async () => {
    for await (const table of baseDataTables) {
        await setupTable(table)
    }

    await setupTransformations(Object.keys(transformationMap))
})

beforeEach(() => {
})
afterEach(async () => {
    for (const table of evakaDataCleanups) {
        await truncateEvakaTable(table)
    }
    evakaDataCleanups = []
})

afterAll(async () => {
    try {
        for (const table of baseDataTables) {
            await dropTable(table)
        }

        for (const table of Object.values(transformationMap)) {
            await dropTable(table)
        }

    } finally {
        return await db.$pool.end()
    }
})

describe("GET /transfer positive", () => {
    it("should return transferred persons", async () => {
        await setupTransformations(["person"])
        await positiveTransferSnapshotTest(
            "person",
            Array(5).fill(personExpectation)
        )
    })
})

const positiveTransferSnapshotTest = async (tableName: string, resultPattern?: any) => {
    const queryObject = {
        returnAll: "true"
    }

    evakaDataCleanups = ["person"]
    const url = `${baseUrl}/${tableName}`
    const response = await request(app).get(url).query(queryObject)
    expect(response.status).toBe(200)
    if (resultPattern) {
        expect(response.body).toMatchSnapshot(resultPattern)
    }
    else {
        expect(response.body).toMatchSnapshot()
    }
    return response
}
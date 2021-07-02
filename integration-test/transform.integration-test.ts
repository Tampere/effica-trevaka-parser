import request from "supertest"
import app from "../src/app"
import db from "../src/db/db"
import { dropTable } from "../src/util/queryTools"

const baseUrl = "/transform"
let cleanUps: string[] = []
const baseDataTables = ["person", "codes", "families"]


const personExpectation = {
    id: expect.any(String),
    date_of_birth: expect.any(String)
}

beforeAll(async () => {
    await Promise.all(baseDataTables.map(table => setupTable(table)))
})

beforeEach(() => {
})
afterEach(async () => {
    await Promise.all(cleanUps.map(table => dropTable(table)))
    cleanUps = []
})

afterAll(async () => {
    await Promise.all(baseDataTables.map(table => dropTable(table)))
    return await db.$pool.end()
})

describe("GET /transform positive", () => {
    it("should return transformed persons", async () => {
        cleanUps = ["evaka_person"]
        await positiveTransformSnapshotTest(
            "person",
            Array(5).fill(personExpectation)
        )

    })
    it("should return transformed families", async () => {

        cleanUps = ["evaka_person", "evaka_fridge_child", "evaka_fridge_partner"]
        await setupTransformations(["person"])

        const fridgeChildExpectation =
            [
                {
                    head_of_family: expect.any(String),
                    child_id: expect.any(String),
                    start_date: expect.any(String),
                    end_date: expect.any(String)
                },
                {
                    head_of_family: expect.any(String),
                    child_id: expect.any(String),
                    start_date: expect.any(String),
                    end_date: null
                },
                {
                    head_of_family: expect.any(String),
                    child_id: expect.any(String),
                    start_date: expect.any(String),
                    end_date: null
                }
            ]

        const fridgePartnerExpectation =
            [
                {
                    partnership_id: expect.any(String),
                    person_id: expect.any(String),
                    start_date: expect.any(String),
                    end_date: expect.any(String)
                },
                {
                    partnership_id: expect.any(String),
                    person_id: expect.any(String),
                    start_date: expect.any(String),
                    end_date: expect.any(String)
                },
                {
                    partnership_id: expect.any(String),
                    person_id: expect.any(String),
                    start_date: expect.any(String),
                    end_date: null
                },
                {
                    partnership_id: expect.any(String),
                    person_id: expect.any(String),
                    start_date: expect.any(String),
                    end_date: null
                }
            ]

        await positiveTransformSnapshotTest(
            "families",
            { child: fridgeChildExpectation, partner: fridgePartnerExpectation }
        )

    })
})

const setupTransformations = async (tfs: string[]) => {
    const responses: Record<string, any> = {}
    for (const name of tfs) {
        responses[name] = await setupTransformation(name)
    }
    return responses
}

const setupTransformation = async (name: string) => {
    const queryObject = {
        returnAll: "true"
    }

    const url = `${baseUrl}/${name}`
    const response = await request(app).get(url).query(queryObject)
    expect(response.status).toBe(200)
    return response.body
}

const positiveTransformSnapshotTest = async (tableName: string, resultPattern?: any) => {
    const queryObject = {
        returnAll: "true"
    }

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

const importTable = async (tableName: string) => {
    const importUrl = "/import"
    const queryObject = {
        path: `/integration-test/data/${tableName}`,
        returnAll: "true",
    }
    return await request(app).get(importUrl).query(queryObject)
}

const setupTable = async (tableName: string) => {
    await db.tx(async t => {
        return dropTable(tableName, t)
    })
    await importTable(tableName)

}

const cleanTransformations = async (tfs: string[]) => {
    return await db.tx(async t => {
        for (const tfName in tfs) {
            await dropTable(tfName, t)
        }
    })
}
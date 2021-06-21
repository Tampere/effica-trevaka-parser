import pgPromise from "pg-promise"
import request from "supertest"
import app from "../src/app"
import db from "../src/db/db"
import { getMigrationSchema } from "../src/util/queryTools"

const baseUrl = "/transform"

const baseDataTables = ["person", "codes"]


const personExpectation = {
    id: expect.any(String),
    date_of_birth: expect.any(String)
}

const dropTable = async (tableName: string, t?: pgPromise.ITask<{}>) => {
    const query = `DROP TABLE IF EXISTS ${getMigrationSchema()}${tableName};`
    if (!t) {
        return await db.tx(async t => t.any(query))
    } else {
        return await t.any(query)
    }

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

beforeAll(async () => {
    await Promise.all(baseDataTables.map(table => setupTable(table)))
})

beforeEach(() => {
})
afterEach(() => {
})

afterAll(async () => {
    await Promise.all(baseDataTables.map(table => dropTable(table)))
    return await db.$pool.end()
})

describe("GET /transform positive", () => {
    it("should return transformed persons", async () => {
        return await positiveTransformSnapshotTest(
            "person",
            Array(5).fill(personExpectation)
        )
    })
})

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
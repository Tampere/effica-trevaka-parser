import request from "supertest"
import app from "../src/app"
import db from "../src/db/db"
import { errorCodes } from "../src/util/error"
import { getMigrationSchema } from "../src/util/queryTools"

const baseUrl = "/import"

let tableToReset: string | undefined = undefined
const tables = ["person", "codes", "income", "incomerows", "families",
    "units", "departments", "placements", "placementextents", "decisions",
    "feedeviations", "childminders"]

type DateRangeExpectation = { [key: string]: any }

const closedDateRange: DateRangeExpectation = {
    startdate: expect.any(String),
    enddate: expect.any(String)
}
const openDateRange: DateRangeExpectation = {
    startdate: expect.any(String)
}

beforeAll(() => { })

beforeEach(() => tableToReset = undefined)
afterEach(async () => {
    if (tableToReset && tables.includes(tableToReset)) {
        return await db.query(`DROP TABLE IF EXISTS ${getMigrationSchema()}${tableToReset};`)
    }
})

afterAll(() => {
    return db.$pool.end()
})

// POSITIVE CASES
describe("GET /import positive", () => {
    it("should return created persons", async () => {
        return await positiveImportSnapshotTest("person")
    })

    it("should return created families", async () => {
        return await positiveImportSnapshotTest(
            "families",
            getTimeSeriesResultPattern(
                closedDateRange,
                closedDateRange,
                closedDateRange,
                openDateRange,
                openDateRange,
                openDateRange))
    })

    it("should return created codes", async () => {
        return await positiveImportSnapshotTest("codes")
    })

    it("should return created income ", async () => {
        return await positiveImportSnapshotTest(
            "income",
            getTimeSeriesResultPattern(closedDateRange, closedDateRange)
        )
    })

    it("should return created incomerows", async () => {
        return await positiveImportSnapshotTest(
            "incomerows",
            getTimeSeriesResultPattern(closedDateRange, closedDateRange)
        )
    })

    it("should return created units", async () => {
        return await positiveImportSnapshotTest(
            "units",
            getTimeSeriesResultPattern(openDateRange, openDateRange))
    })

    it("should return created departments", async () => {
        return await positiveImportSnapshotTest(
            "departments",
            getTimeSeriesResultPattern(openDateRange, openDateRange))
    })

    it("should return created placements", async () => {
        return await positiveImportSnapshotTest(
            "placements",
            getTimeSeriesResultPattern(openDateRange, openDateRange))
    })

    it("should return created placementextents", async () => {
        return await positiveImportSnapshotTest(
            "placementextents",
            getTimeSeriesResultPattern(openDateRange, openDateRange))
    })

    it("should return created decisions", async () => {
        return await positiveImportSnapshotTest(
            "decisions",
            getTimeSeriesResultPattern({ ...openDateRange, decisiondate: expect.any(String) }))
    })

    it("should return created feedeviations", async () => {
        return await positiveImportSnapshotTest("feedeviations",
            getTimeSeriesResultPattern(openDateRange, openDateRange))
    })

    it("should return created childminders", async () => {
        return await positiveImportSnapshotTest(
            "childminders",
            getTimeSeriesResultPattern(openDateRange))
    })

    it("should work even if XML elements have mixed case", async () => {
        const queryObject = {
            path: "/integration-test/data/mixedcase",
            returnAll: "true",
        }

        const response = await request(app).get(baseUrl).query(queryObject)
        expect(response.status).toBe(200)
        expect(response.body).toMatchSnapshot()

        tableToReset = "codes"
        return response
    })
})


// NEGATIVE CASES
describe("GET /import negative", () => {
    it("should fail on non flat data", async () => {
        return await negativeImportTest("nonflat", 500, errorCodes.nonFlatData)
    })

    it("should fail on non mapped table", async () => {
        return await negativeImportTest("unknowntable", 500, errorCodes.nonMappedTable)
    })

    it("should fail on non mapped column", async () => {
        return await negativeImportTest("unknowncolumn", 500, errorCodes.nonMappedColumn)
    })

    it("should fail on no data content", async () => {
        return await negativeImportTest("empty", 500, errorCodes.noDataContent)
    })

    it("should fail on ambiguous data content", async () => {
        return await negativeImportTest("ambiguous", 500, errorCodes.ambiguousTableData)
    })
})

//decouple timeseries expectation snapshots from local timezone
const getTimeSeriesResultPattern = (...expectations: DateRangeExpectation[]) => {
    return {
        inserts: [expectations]
    }
}

const positiveImportSnapshotTest = async (tableName: string, resultPattern?: any) => {
    const queryObject = {
        path: `/integration-test/data/${tableName}`,
        returnAll: "true",
    }

    const response = await request(app).get(baseUrl).query(queryObject)
    expect(response.status).toBe(200)
    if (resultPattern) {
        expect(response.body).toMatchSnapshot(resultPattern)
    }
    else {
        expect(response.body).toMatchSnapshot()
    }
    tableToReset = tableName
    return response
}

const negativeImportTest = async (path: string, status: number, expectedErrorCode: string) => {
    const queryObject = {
        path: `/integration-test/data/error/${path}`,
        returnAll: "true",
    }

    const response = await request(app).get(baseUrl).query(queryObject)
    expect(response.status).toBe(status)
    expect(response.text).toContain(expectedErrorCode)

    return response
}
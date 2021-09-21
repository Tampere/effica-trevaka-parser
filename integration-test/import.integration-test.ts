import request from "supertest"
import app from "../src/app"
import { getChildminderMap, getExtentMap } from "../src/db/common"
import db from "../src/db/db"
import { errorCodes } from "../src/util/error"
import { dropTable } from "../src/util/queryTools"
import { setupTables } from "../src/util/testTools"

const baseUrl = "/import"
let cleanUps: string[] = []

const tables = ["person", "codes", "income", "incomerows", "families",
    "units", "departments", "placements", "placementextents", "decisions",
    "feedeviations", "childminders", "evaka_areas", "unitmap", "childmindermap",
    "applications", "applicationrows", "evaka_unit_manager", "evaka_daycare"]

type DateRangeExpectation = { [key: string]: any }

const closedDateRange: DateRangeExpectation = {
    startdate: expect.any(String),
    enddate: expect.any(String)
}
const openDateRange: DateRangeExpectation = {
    startdate: expect.any(String),
    enddate: null
}

beforeAll(async () => {
    await Promise.all(tables.map(table => dropTable(table)))
})

beforeEach(() => { })
afterEach(async () => {
    for (const table of cleanUps) {
        await dropTable(table)
    }
    cleanUps = []
})

afterAll(async () => {
    try {
        for (const table of tables) {
            await dropTable(table)
        }
    } finally {
        return db.$pool.end()
    }
})

// POSITIVE CASES
describe("GET /import xml positive", () => {
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
                openDateRange,
                openDateRange))
    })

    it("should return created codes", async () => {
        return await positiveImportSnapshotTest("codes")
    })

    it("should return created income ", async () => {
        return await positiveImportSnapshotTest(
            "income",
            getTimeSeriesResultPattern(closedDateRange, openDateRange)
        )
    })

    it("should return created incomerows", async () => {
        return await positiveImportSnapshotTest(
            "incomerows",
            getTimeSeriesResultPattern(openDateRange, closedDateRange)
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

    it("should return created applications", async () => {
        return await positiveImportSnapshotTest(
            "applications")
    })

    it("should return created application rows", async () => {
        return await positiveImportSnapshotTest(
            "applicationrows")
    })

    it("should work even if XML elements have mixed case", async () => {
        const queryObject = {
            path: "/integration-test/data/mixedcase",
            returnAll: "true",
        }

        const response = await request(app).get(baseUrl).query(queryObject)
        expect(response.status).toBe(200)
        expect(response.body).toMatchSnapshot()

        return response
    })
})

describe("GET /import csv positive", () => {
    it("should return created evaka areas", async () => {
        return await positiveImportSnapshotTest("evaka_areas")
    })
    it("should return created extentmaps", async () => {
        const result = await positiveImportSnapshotTest("extentmap")
        const map = await db.tx(async (t) => await getExtentMap(t))
        expect(map).toStrictEqual({
            "461": {
                "id": "19fec146-e2f1-11eb-8473-db55258254c5",
                "name": null
            },
            "999340002": {
                "id": "19fec1fa-e2f1-11eb-8473-eb1f7ce94b07",
                "name": null
            }
        })
        return result
    })
    it("should return created unitmaps", async () => {
        return await positiveImportSnapshotTest("unitmap")
    })
    it("should return created childmindermaps", async () => {
        const result = await positiveImportSnapshotTest("childmindermap")
        const map = await db.tx(async (t) => await getChildminderMap(t))
        expect(map).toStrictEqual({
            "130963-949H": "19fec146-e2f1-11eb-8473-db55258254c5",
            "130953-9908": "19fec1fa-e2f1-11eb-8473-eb1f7ce94b07"
        })
        return result
    })
    it("should return created evaka unit managers", async () => {
        return await positiveImportSnapshotTest("evaka_unit_manager")
    })
    it("should return created evaka daycares", async () => {
        cleanUps = ["evaka_areas"]
        await setupTables(["evaka_areas"])
        return await positiveImportSnapshotTest("evaka_daycare")
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
import request from "supertest"
import app from "../src/app"
import db from "../src/db/db"
import { dropTable, truncateEvakaTable } from "../src/util/queryTools"
import { setupTable, setupTransfers, setupTransformations } from "../src/util/testTools"

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
        "placements",
        "extentmap",
        "placementextents",
        "income",
        "incomerows",
        "evaka_areas",
        "evaka_unit_manager",
        "evaka_daycare"
    ]

//endpoint: table
const transformationMap: Record<string, string> = {
    person: "evaka_person"
}

let evakaDataCleanups: string[] = [
    "daycare",
    "person",
    "unit_manager"
]

const daycareExpectation = {
    created: expect.any(String),
    updated: expect.any(String)
}

const daycareGroupExpectation = {
    id: expect.any(String)
}

const personExpectation = {
    id: expect.any(String),
    date_of_birth: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
    updated_from_vtj: expect.any(String),
}

const childExpectation = {
    id: expect.any(String)
}

const fridgeChildExpectation = {
    id: expect.any(String),
    child_id: expect.any(String),
    head_of_child: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String)
}
const fridgePartnerExpectation = {
    partnership_id: expect.any(String),
    person_id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String)
}

const placementExpectation = {
    id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
    child_id: expect.any(String)
}

const serviceNeedExpectation = {
    id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
    placement_id: expect.any(String)
}

const groupPlacementExpectation = {
    id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
    daycare_placement_id: expect.any(String),
    daycare_group_id: expect.any(String)
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
    it("should return transferred daycares", async () => {
        await setupTransfers(["unit_manager"])
        await positiveTransferSnapshotTest(
            "daycare",
            Array(2).fill(daycareExpectation)
        )
    })
    it("should return transferred departments", async () => {
        await setupTransformations(["departments"])
        await setupTransfers(["unit_manager", "daycare"])
        await positiveTransferSnapshotTest(
            "departments",
            Array(2).fill(daycareGroupExpectation)
        )
    })
    it("should return transferred persons", async () => {
        await setupTransformations(["person"])
        await positiveTransferSnapshotTest(
            "person",
            Array(5).fill(personExpectation)
        )
    })
    it("should return transferred families", async () => {
        await setupTransformations(["person", "families"])
        await setupTransfers(["person"])
        await positiveTransferSnapshotTest(
            "families",
            {
                children: Array(3).fill(fridgeChildExpectation),
                partners: Array(4).fill(fridgePartnerExpectation)
            }
        )
    })
    it("should return transferred placements", async () => {
        await setupTransformations(["person", "departments", "placements"])
        await setupTransfers(["person", "unit_manager", "daycare", "departments"])
        await positiveTransferSnapshotTest(
            "placements",
            {
                children: Array(2).fill(childExpectation),
                placements: Array(3).fill(placementExpectation),
                serviceNeeds: Array(2).fill(serviceNeedExpectation),
                daycareGroups: Array(1).fill(daycareGroupExpectation),
                groupPlacements: Array(3).fill(groupPlacementExpectation)
            }
        )
    })
})

const positiveTransferSnapshotTest = async (tableName: string, resultPattern?: any) => {
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
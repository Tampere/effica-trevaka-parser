// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import request from "supertest"
import app from "../src/app"
import db from "../src/db/db"
import { initDb } from "../src/init"
import { dropTable, truncateEvakaTable } from "../src/util/queryTools"
import { setupTable, setupTransfers, setupTransformations } from "../src/util/testTools"

const baseUrl = "/transfer"

//order based on dependency
const baseDataTables =
    [
        "persons",
        "codes",
        "families",
        "units",
        "departments",
        "unitmap",
        "childmindermap",
        "placements",
        "extentmap",
        "placementextents",
        "feedeviations",
        "income",
        "incomerows",
        "applications",
        "applicationrows",
        "decisions",
        "evaka_areas",
        "evaka_unit_manager",
        "evaka_daycare"
    ]

//endpoint: table
const transformationMap: Record<string, string> = {
    persons: "evaka_person"
}

let evakaDataCleanups: string[] = [
    "fee_alteration",
    "daycare",
    "person",
    "unit_manager",
    "daycare_group"
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

const applicationExpectation = {
    id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
    child_id: expect.any(String),
    guardian_id: expect.any(String),
}
const applicationFormExpectation = {
    id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
    application_id: expect.any(String),
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

const feeAlterationExpectation = {
    id: expect.any(String),
    person_id: expect.any(String),
    updated_at: expect.any(String),
    updated_by: expect.any(String)
}

const voucherValueDecisionExpectation = {
    id: expect.any(String),
    child_id: expect.any(String),
    head_of_family_id: expect.any(String),
    partner_id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String)
}

beforeAll(async () => {
    await initDb()

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
        await setupTransformations(["persons"])
        await positiveTransferSnapshotTest(
            "persons",
            Array(5).fill(personExpectation)
        )
    })
    it("should return transferred families", async () => {
        await setupTransformations(["persons", "families"])
        await setupTransfers(["persons"])
        await positiveTransferSnapshotTest(
            "families",
            {
                children: Array(3).fill(fridgeChildExpectation),
                partners: Array(4).fill(fridgePartnerExpectation)
            }
        )
    })
    it("should return transferred applications", async () => {
        await setupTransformations(["person", "families", "application"])
        await setupTransfers(["person", "families"])
        await positiveTransferSnapshotTest(
            "application",
            {
                applications: Array(1).fill(applicationExpectation),
                applicationForms: Array(1).fill(applicationFormExpectation)
            }
        )
    })
    it("should return transferred placements", async () => {
        await setupTransformations(["persons", "departments", "placements"])
        await setupTransfers(["persons", "unit_manager", "daycare", "departments"])
        await positiveTransferSnapshotTest(
            "placements",
            {
                children: Array(2).fill(childExpectation),
                placements: Array(3).fill(placementExpectation),
                serviceNeeds: Array(2).fill(serviceNeedExpectation),
                daycareGroups: Array(1).fill(daycareGroupExpectation),
                groupPlacements: Array(3).fill(groupPlacementExpectation),
                cleanedDaycareGroups: Array(1).fill(daycareGroupExpectation)
            }
        )
    })
    it("should return transferred fee alterations", async () => {
        await setupTransformations(["persons", "departments", "placements", "feedeviations"])
        await setupTransfers(["persons", "unit_manager", "daycare", "departments", "placements"])
        await positiveTransferSnapshotTest(
            "fee_alterations",
            Array(1).fill(feeAlterationExpectation)
        )
    })

    it("should return transferred income", async () => {
        const incomeOpenExpectation = {

            id: expect.any(String),
            person_id: expect.any(String),
            updated_at: expect.any(String),
            updated_by: expect.any(String),
            valid_from: expect.any(String),
        }
        const incomeClosedExpectation = {
            ...incomeOpenExpectation,
            valid_to: expect.any(String)
        }

        await setupTransformations(["persons", "income"])
        await setupTransfers(["persons"])
        await positiveTransferSnapshotTest(
            "income",
            [incomeOpenExpectation, incomeClosedExpectation]
        )
    })

    it("should return transferred voucher value decisions", async () => {
        await setupTransformations(["person", "families", "departments", "placements", "feedeviations", "voucher_value_decisions"])
        await setupTransfers(["person", "families", "unit_manager", "daycare", "departments", "placements", "fee_alterations"])
        await positiveTransferSnapshotTest(
            "voucher_value_decisions",
            Array(1).fill(voucherValueDecisionExpectation)
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
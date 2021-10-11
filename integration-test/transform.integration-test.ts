// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import request from "supertest"
import app from "../src/app"
import db from "../src/db/db"
import { initDb } from "../src/init"
import { dropTable, truncateEvakaTable } from "../src/util/queryTools"
import { setupTable, setupTransfers, setupTransformations } from "../src/util/testTools"

const baseUrl = "/transform"
let cleanUps: string[] = []

let evakaDataCleanups: string[] = [
    "person",
]

//order based on dependency
const baseDataTables =
    [
        "persons",
        "codes",
        "families",
        "units",
        "departments",
        "extentmap",
        "unitmap",
        "childmindermap",
        "placements",
        "placementextents",
        "feedeviations",
        "income",
        "incomerows",
        "decisions",
        "applications",
        "applicationrows",
        "evaka_areas",
        "evaka_unit_manager",
        "evaka_daycare"
    ]


const personExpectation = {
    id: expect.any(String),
    date_of_birth: expect.any(String)
}

beforeAll(async () => {
    await initDb()

    for (const table of baseDataTables) {
        await setupTable(table)
    }
})

beforeEach(() => {
})
afterEach(async () => {
    for (const table of cleanUps) {
        await dropTable(table)
    }
    cleanUps = []
    for (const table of evakaDataCleanups) {
        await truncateEvakaTable(table)
    }
})

afterAll(async () => {
    try {
        for (const table of baseDataTables) {
            await dropTable(table)
        }
    } finally {
        return await db.$pool.end()
    }
})

describe("GET /transform positive", () => {
    it("should return transformed persons", async () => {
        cleanUps = ["evaka_person"]
        const response1 = await positiveTransformSnapshotTest(
            "persons",
            Array(5).fill(personExpectation)
        )
        // verify maintain ids between migrations
        const response2 = await transform("person")
        expect(response2.body).toEqual(
            expect.arrayContaining(response1.body.map((person: any) => expect.objectContaining({ id: person.id })))
        )
    })
    it("should return transformed families", async () => {

        cleanUps = ["evaka_person", "evaka_fridge_child", "evaka_fridge_partner"]
        await setupTransformations(["persons"])

        const fridgeChildExpectation =
            [
                {
                    id: expect.any(String),
                    head_of_family: expect.any(String),
                    child_id: expect.any(String),
                    start_date: expect.any(String)
                },
                {
                    id: expect.any(String),
                    head_of_family: expect.any(String),
                    child_id: expect.any(String),
                    start_date: expect.any(String)
                },
                {
                    id: expect.any(String),
                    head_of_family: expect.any(String),
                    child_id: expect.any(String),
                    start_date: expect.any(String)
                }
            ]

        const fridgePartnerExpectation =
            [
                {
                    partnership_id: expect.any(String),
                    person_id: expect.any(String),
                    start_date: expect.any(String)
                },
                {
                    partnership_id: expect.any(String),
                    person_id: expect.any(String),
                    start_date: expect.any(String),
                },
                {
                    partnership_id: expect.any(String),
                    person_id: expect.any(String),
                    start_date: expect.any(String),
                },
                {
                    partnership_id: expect.any(String),
                    person_id: expect.any(String),
                    start_date: expect.any(String),
                }
            ]

        await positiveTransformSnapshotTest(
            "families",
            { child: fridgeChildExpectation, partner: fridgePartnerExpectation }
        )

    })
    it("should return transformed departments", async () => {
        cleanUps = ["evaka_daycare_group"]

        const daycareGroupExpectation =
            [
                {
                    id: expect.any(String),
                    start_date: expect.any(String),
                    end_date: null
                },
                {
                    id: expect.any(String),
                    start_date: expect.any(String),
                    end_date: null
                }
            ]

        await positiveTransformSnapshotTest(
            "departments",
            daycareGroupExpectation
        )
    })

    it("should return transformed placements", async () => {
        await setupTransformations(["persons", "departments"])

        const placementExpectation = {
            id: expect.any(String),
            child_id: expect.any(String),
            daycare_group_id: expect.any(String)
        }
        const serviceNeedExpectation = {
            id: expect.any(String),
            placement_id: expect.any(String)
        }

        await positiveTransformSnapshotTest(
            "placements",
            {
                placements: [
                    placementExpectation,
                    placementExpectation,
                    { ...placementExpectation, daycare_group_id: null }
                ],
                placementsTodo: [
                    { ...placementExpectation, daycare_group_id: null },
                    { ...placementExpectation, daycare_group_id: null }
                ],
                serviceNeeds: Array(2).fill(serviceNeedExpectation),
                serviceNeedsTodo: []
            }
        )
    })

    it("should return transformed feedeviations", async () => {
        await setupTransformations(["persons", "departments", "placements"])

        const feeAlterationExpectation = {
            id: expect.any(String),
            person_id: expect.any(String)
        }

        await positiveTransformSnapshotTest(
            "feedeviations",
            Array(1).fill(feeAlterationExpectation)
        )
    })

    it("should return transformed income", async () => {
        cleanUps = ["evaka_income", "evaka_person"]
        //TODO: application transformation?
        await setupTransformations(["persons"])

        //TODO: add application id?
        const incomeExpectation =
            [
                {
                    id: expect.any(String),
                    person_id: expect.any(String),
                    valid_from: expect.any(String),
                    valid_to: null
                },
                {
                    id: expect.any(String),
                    person_id: expect.any(String),
                    valid_from: expect.any(String),
                    valid_to: expect.any(String)
                }
            ]

        await positiveTransformSnapshotTest(
            "income",
            incomeExpectation
        )
    })

    it("should return transformed voucher value decisions", async () => {
        await setupTransformations(["person", "families", "departments", "placements", "income"])

        const voucherValueDecisionExpectation = {
            id: expect.any(String),
            head_of_family_id: expect.any(String),
            partner_id: expect.any(String),
            child_id: expect.any(String),
        }

        const response1 = await positiveTransformSnapshotTest(
            "voucher_value_decisions",
            {
                decisions: Array(1).fill(voucherValueDecisionExpectation),
                decisionsTodo: Array(0).fill(voucherValueDecisionExpectation)
            }
        )
        // verify maintain ids between migrations
        const response2 = await transform("voucher_value_decisions")
        expect(response2.body.decisions).toEqual(
            expect.arrayContaining(response1.body.decisions.map((decision: any) => expect.objectContaining({ id: decision.id })))
        )
    })

    it("should return transformed application", async () => {
        cleanUps = ["evaka_person", "evaka_fridge_child", "evaka_fridge_partner"]

        await setupTransformations(["persons", "families"])
        await setupTransfers(["persons", "families"])

        const applicationExpectation = {
            id: expect.any(String),
            child_id: expect.any(String),
            guardian_id: expect.any(String),
        }
        const applicationFormExpectation = {
            application_id: expect.any(String),
        }

        const response1 = await positiveTransformSnapshotTest("application", {
            applications: Array(1).fill(applicationExpectation),
            applicationsTodo: Array(0).fill(applicationExpectation),
            applicationForms: Array(1).fill(applicationFormExpectation),
            applicationFormsTodo: Array(0).fill(applicationFormExpectation),
        })
        // verify maintain ids between migrations
        const response2 = await transform("application")
        expect(response2.body.applications).toEqual(
            expect.arrayContaining(response1.body.applications.map((application: any) => expect.objectContaining({ id: application.id })))
        )
    })

})

const positiveTransformSnapshotTest = async (tableName: string, resultPattern?: any) => {
    const response = await transform(tableName)
    if (resultPattern) {
        expect(response.body).toMatchSnapshot(resultPattern)
    }
    else {
        expect(response.body).toMatchSnapshot()
    }
    return response
}

const transform = async (tableName: string) => {
    const queryObject = {
        returnAll: "true"
    }

    const url = `${baseUrl}/${tableName}`
    const response = await request(app).get(url).query(queryObject)
    expect(response.status).toBe(200)
    return response
}

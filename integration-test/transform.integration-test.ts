// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import request from "supertest"
import app from "../src/app"
import db from "../src/db/db"
import { initDb } from "../src/init"
import { dropTable, truncateEvakaTables } from "../src/util/queryTools"
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
        "families_exclusion",
        "families",
        "specialneeds",
        "specialmeans",
        "units",
        "departments",
        "extentmap",
        "unitmap",
        "childmindermap",
        "placements_exclusion",
        "placements",
        "placementextents",
        "feedeviations",
        "income",
        "incomerows",
        "decisions",
        "paydecisions",
        "paydecisionrows",
        "applications",
        "applicationrows",
        "dailyjournals",
        "dailyjournalrows",
        "timestampheaders",
        "timestampdetails",
        "archiveddocument",
        "evaka_areas",
        "evaka_daycare",
        "daycare_oid_map"

    ]


const personExpectation = {
    id: expect.any(String),
    date_of_birth: expect.any(String)
}

beforeAll(async () => {
    await initDb()

    for (const table of baseDataTables) {
        const importTarget = table === "archiveddocument" ? "archiveddocument" : undefined
        await setupTable(table, importTarget)
    }
})

beforeEach(() => {
})
afterEach(async () => {
    for (const table of cleanUps) {
        await dropTable(table)
    }
    cleanUps = []

    await truncateEvakaTables(evakaDataCleanups)

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
        await positiveTransformSnapshotTest(
            "persons",
            Array(10).fill(personExpectation)
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
    it("should return transformed special needs", async () => {
        await setupTransformations(["persons"])

        const assistanceNeedExpectation = {
            id: expect.any(String),
            child_id: expect.any(String),
        }

        await positiveTransformSnapshotTest(
            "special_needs",
            {
                "assistanceNeeds": Array(1).fill(assistanceNeedExpectation),
                "assistanceNeedsTodo": Array(0).fill(assistanceNeedExpectation),
            }
        )
    })
    it("should return transformed special means", async () => {
        await setupTransformations(["persons"])

        const assistanceActionExpectation = {
            id: expect.any(String),
            child_id: expect.any(String),
        }

        await positiveTransformSnapshotTest(
            "special_means",
            {
                assistanceActions: Array(1).fill(assistanceActionExpectation),
                assistanceActionsTodo: Array(0).fill(assistanceActionExpectation),
            }
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
        await setupTransformations(["persons", "families", "departments", "application"])

        const placementExpectation = {
            id: expect.any(String),
            child_id: expect.any(String),
            daycare_group_id: expect.any(String)
        }
        const applicationExpectation = {
            id: expect.any(String),
            child_id: expect.any(String),
            guardian_id: expect.any(String),
        }

        await positiveTransformSnapshotTest(
            "placements",
            {
                placements: [
                    placementExpectation, // p=11, e=111
                    placementExpectation, // p=12, e=12
                    { ...placementExpectation, daycare_group_id: null }, // p=13, e=131
                    placementExpectation, // p=18, e=18
                    placementExpectation, // p=20, e=200
                    placementExpectation, // p=21, e=210
                    placementExpectation, // p=22, e=220
                    placementExpectation, // p=23, e=230
                ],
                placementsTodo: [
                    placementExpectation, // p=11, p=112
                    { ...placementExpectation, daycare_group_id: null }, // p=14, e=14
                    { ...placementExpectation, daycare_group_id: null }, // p=15, e=15
                    { ...placementExpectation, daycare_group_id: null }, // p=17, e=17
                    { ...placementExpectation, daycare_group_id: null }, // p=17, e=17
                    placementExpectation, // p=19, e=191
                    placementExpectation, // p=19, e=192
                ],
                applications: [
                    applicationExpectation,
                    applicationExpectation,
                ]
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
        await setupTransformations(["persons"])

        const incomeExpectation = {
            id: expect.any(String),
            person_id: expect.any(String),
        }

        await positiveTransformSnapshotTest(
            "income",
            Array(2).fill(incomeExpectation)
        )
    })

    it("should return transformed voucher value decisions", async () => {
        await setupTransformations(["persons", "families", "departments", "placements", "income"])

        const voucherValueDecisionExpectation = {
            id: expect.any(String),
            head_of_family_id: expect.any(String),
            partner_id: expect.any(String),
            child_id: expect.any(String),
        }

        await positiveTransformSnapshotTest(
            "voucher_value_decisions",
            {
                decisions: Array(1).fill(voucherValueDecisionExpectation),
                decisionsTodo: Array(0).fill(voucherValueDecisionExpectation)
            }
        )
    })

    it("should return transformed pay decisions", async () => {
        await setupTransformations(["persons", "departments", "placements"])

        const feeDecisionExpectation = {
            id: expect.any(String),
            head_of_family_id: expect.any(String),
            partner_id: expect.any(String) || null
        }
        const feeDecisionChildExpectation = {
            id: expect.any(String),
            fee_decision_id: expect.any(String),
            child_id: expect.any(String)
        }

        await positiveTransformSnapshotTest(
            "pay_decisions",
            {
                feeDecisions: [
                    { ...feeDecisionExpectation, partner_id: null },
                    feeDecisionExpectation,
                    { ...feeDecisionExpectation, partner_id: null }
                ],
                feeDecisionsTodo: [
                    { ...feeDecisionExpectation, partner_id: null }
                ],
                feeDecisionChildren: Array(3).fill(feeDecisionChildExpectation),
                feeDecisionChildrenTodo: Array(0).fill(feeDecisionChildExpectation),
            }
        )
    })

    it("should return transformed daily journals", async () => {
        await setupTransformations(["persons", "departments", "placements"])

        const absenceExpectation = {
            id: expect.any(String),
            child_id: expect.any(String),
        }

        const backupCareExpectation = {
            id: expect.any(String),
            child_id: expect.any(String),
            unit_id: expect.any(String),
            group_id: expect.any(String),
        }

        await positiveTransformSnapshotTest(
            "daily_journals",
            {
                absences: Array(1).fill(absenceExpectation),
                absencesTodo: Array(1).fill(absenceExpectation),
                backupCares: Array(2).fill(backupCareExpectation),
                backupCaresTodo: Array(0).fill(backupCareExpectation),
            }
        )
    })

    it("should return transformed timestamps", async () => {
        await setupTransformations(["persons"])

        const childAttendanceExpectation = {
            id: expect.any(String),
            child_id: expect.any(String),
        }

        await positiveTransformSnapshotTest(
            "timestamps",
            {
                childAttendances: Array(1).fill(childAttendanceExpectation),
                childAttendancesTodo: Array(0).fill(childAttendanceExpectation),
            }
        )
    })

    it("should return transformed pedagogical documents", async () => {
        await setupTransformations(["persons"])

        const pedagogicalDocumentExpectation = {
            id: expect.any(String),
            child_id: expect.any(String),
            attachment_id: expect.any(String),
        }

        await positiveTransformSnapshotTest(
            "pedagogical_documents",
            {
                data: Array(2).fill(pedagogicalDocumentExpectation),
                todo: Array(0).fill(pedagogicalDocumentExpectation),
            }
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

        await positiveTransformSnapshotTest("application", {
            applications: Array(2).fill(applicationExpectation),
            applicationsTodo: Array(0).fill(applicationExpectation),
            applicationForms: Array(2).fill(applicationFormExpectation),
            applicationFormsTodo: Array(0).fill(applicationFormExpectation),
        })
    })

    it("should return cleanups", async () => {
        await setupTransformations(["persons", "departments", "placements"])

        const daycareGroupExpectation = {
            id: expect.any(String)
        }

        await positiveTransformSnapshotTest(
            "cleanup",
            {
                cleanedDaycareGroups: Array(1).fill(daycareGroupExpectation),
            }
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

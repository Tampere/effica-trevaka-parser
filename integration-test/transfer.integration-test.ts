// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import request from "supertest"
import app from "../src/app"
import db from "../src/db/db"
import { initDb } from "../src/init"
import { cleanupDb, setupTable, setupTransfers, setupTransformations } from "../src/util/testTools"
import migrationDb from "../src/db/db";

const baseUrl = "/transfer"

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
        "unitmap",
        "childmindermap",
        "placements_exclusion",
        "placements",
        "extentmap",
        "placementextents",
        "feedeviations",
        "income",
        "incomerows",
        "applications",
        "applicationrows",
        "decisions",
        "paydecisions",
        "paydecisionrows",
        "dailyjournals",
        "dailyjournalrows",
        "timestampheaders",
        "timestampdetails",
        "paikky_document",
        "evaka_areas",
        "evaka_daycare",
        "daycare_oid_map"
    ]

//endpoint: table
const transformationMap: Record<string, string> = {
    persons: "evaka_person"
}

const daycareExpectation = {
    created: expect.any(String),
    updated: expect.any(String)
}

const daycareGroupExpectation = {
    id: expect.any(String)
}

const caretakersExpectation = {
    id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
    group_id: expect.any(String),
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
    created_at: expect.any(String),
    created_by: expect.any(String),
    updated: expect.any(String)
}

const assistanceNeedExpectation = {
    id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
    updated_by: expect.any(String),
    child_id: expect.any(String),
}
const assistanceBasisExpectation = {
    need_id: expect.any(String),
    option_id: expect.any(String),
    created: expect.any(String),
}

const assistanceActionExpectation = {
    id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
    updated_by: expect.any(String),
    child_id: expect.any(String),
}
const assistanceActionOptionRefExpectation = {
    action_id: expect.any(String),
    option_id: expect.any(String),
    created: expect.any(String),
}

const applicationExpectation = {
    id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
    child_id: expect.any(String),
    guardian_id: expect.any(String),
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

const feeDecisionExpectation = {
    id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
    head_of_family_id: expect.any(String),
    partner_id: expect.any(String),
}

const feeDecisionChildExpectation = {
    id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
    child_id: expect.any(String),
    fee_decision_id: expect.any(String),
}

const absenceExpectation = {
    id: expect.any(String),
    child_id: expect.any(String),
    modified_at: expect.any(String),
    modified_by: expect.any(String),
}

const backupCareExpectation = {
    id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
    child_id: expect.any(String),
    unit_id: expect.any(String),
    group_id: expect.any(String),
}

const childAttendanceExpectation = {
    id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
    child_id: expect.any(String),
}

const pedagogicalDocumentExpectation = {
    id: expect.any(String),
    child_id: expect.any(String),
    created_by: expect.any(String),
    updated_by: expect.any(String),
}

const messageAccountExpectation = {
    id: expect.any(String),
    created: expect.any(String),
    updated: expect.any(String),
}

beforeAll(async () => {
    await migrationDb.tx(async (tx) => await initDb(tx))
})

beforeEach(async () => {
    await db.tx(tx => cleanupDb(tx));

    for await (const table of baseDataTables) {
        const importTarget = table === "paikky_document" ? "paikky_document" : undefined
        await setupTable(table, importTarget)
    }

    await setupTransformations(Object.keys(transformationMap))
})

afterAll(async () => {
    await db.$pool.end()
})

describe("GET /transfer positive", () => {
    xit("should return transferred daycares", async () => {
        await positiveTransferSnapshotTest(
            "daycare",
            Array(3).fill(daycareExpectation)
        )
    })
    xit("should return transferred departments", async () => {
        await setupTransformations(["departments"])
        await setupTransfers(["daycare"])
        await positiveTransferSnapshotTest(
            "departments",
            {
                groups: Array(2).fill(daycareGroupExpectation),
                caretakers: Array(2).fill(caretakersExpectation),
                messageAccounts: Array(2).fill({
                    ...messageAccountExpectation,
                    daycare_group_id: expect.any(String)
                }),
            }
        )
    })
    it("should return transferred persons", async () => {
        await setupTransformations(["persons"])
        await positiveTransferSnapshotTest(
            "persons",
            {
                persons: Array(10).fill(personExpectation),
                messageAccounts: Array(10).fill({
                    ...messageAccountExpectation,
                    person_id: expect.any(String),
                })
            }
        )
    })
    xit("should return transferred families", async () => {
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
    it("should return transferred assistance needs", async () => {
        await setupTransformations(["persons", "special_needs"])
        await setupTransfers(["persons"])
        await positiveTransferSnapshotTest(
            "assistance_needs",
            {
                assistanceNeeds: Array(1).fill(assistanceNeedExpectation),
                assistanceBases: [],
            }
        )
    })
    it("should return transferred assistance actions", async () => {
        await setupTransformations(["persons", "special_means"])
        await setupTransfers(["persons"])
        await positiveTransferSnapshotTest(
            "assistance_actions",
            {
                assistanceActions: Array(1).fill(assistanceActionExpectation),
                assistanceActionOptions: Array(1).fill(assistanceActionOptionRefExpectation),
            }
        )
    })
    xit("should return transferred applications", async () => {
        await setupTransformations(["persons", "families", "application", "departments", "placements"])
        await setupTransfers(["persons", "families", "daycare", "departments", "placements"])
        await positiveTransferSnapshotTest(
            "application",
            {
                applications: Array(2).fill(applicationExpectation)
            }
        )
    })
    xit("should return transferred placements", async () => {
        await setupTransformations(["persons", "departments", "placements"])
        await setupTransfers(["persons", "daycare", "departments"])
        await positiveTransferSnapshotTest(
            "placements",
            {
                children: Array(4).fill(childExpectation),
                placements: Array(8).fill(placementExpectation),
                serviceNeeds: Array(8).fill(serviceNeedExpectation),
                daycareGroups: Array(1).fill(daycareGroupExpectation),
                groupPlacements: Array(8).fill(groupPlacementExpectation),
            }
        )
    })
    xit("should return transferred fee alterations", async () => {
        await setupTransformations(["persons", "departments", "placements", "feedeviations"])
        await setupTransfers(["persons", "daycare", "departments", "placements"])
        await positiveTransferSnapshotTest(
            "fee_alterations",
            Array(1).fill(feeAlterationExpectation)
        )
    })

    it("should return transferred income", async () => {
        const incomeExpectation = {

            id: expect.any(String),
            person_id: expect.any(String),
            updated_at: expect.any(String),
            updated_by: expect.any(String),
        }

        await setupTransformations(["persons", "income"])
        await setupTransfers(["persons"])
        await positiveTransferSnapshotTest(
            "income",
            Array(2).fill(incomeExpectation)
        )
    })

    xit("should return transferred voucher value decisions", async () => {
        await setupTransformations(["persons", "families", "departments", "placements", "feedeviations", "voucher_value_decisions"])
        await setupTransfers(["persons", "families", "daycare", "departments", "placements", "fee_alterations"])
        await positiveTransferSnapshotTest(
            "voucher_value_decisions",
            Array(1).fill(voucherValueDecisionExpectation)
        )
    })

    xit("should return transferred fee decisions", async () => {
        await setupTransformations(["persons", "families", "departments", "placements", "feedeviations", "pay_decisions"])
        await setupTransfers(["persons", "families", "daycare", "departments", "placements", "fee_alterations"])
        await positiveTransferSnapshotTest(
            "fee_decisions",
            {
                feeDecisions: [
                    { ...feeDecisionExpectation, partner_id: null },
                    feeDecisionExpectation,
                    { ...feeDecisionExpectation, partner_id: null }
                ],
                feeDecisionChildren: Array(3).fill(feeDecisionChildExpectation),
            }
        )
    })

    xit("should return transferred absences", async () => {
        await setupTransformations(["persons", "departments", "placements", "daily_journals"])
        await setupTransfers(["persons", "daycare", "departments", "placements"])
        await positiveTransferSnapshotTest(
            "absences",
            Array(1).fill(absenceExpectation)
        )
    })

    xit("should return transferred backup cares", async () => {
        await setupTransformations(["persons", "departments", "placements", "daily_journals"])
        await setupTransfers(["persons", "daycare", "departments", "placements"])
        await positiveTransferSnapshotTest(
            "backup_cares",
            Array(2).fill(backupCareExpectation)
        )
    })

    xit("should return transferred child attendances", async () => {
        await setupTransformations(["persons", "timestamps"])
        await setupTransfers(["persons", "daycare"])
        await positiveTransferSnapshotTest(
            "child_attendances",
            Array(1).fill(childAttendanceExpectation)
        )
    })

    it("should return transferred pedagogical document data", async () => {
        await setupTransformations(["persons", "pedagogical_documents"])
        await setupTransfers(["persons"])
        await positiveTransferSnapshotTest(
            "pedagogical_documents/data",
            Array(2).fill(pedagogicalDocumentExpectation)
        )
    })

    it("should return transferred pedagogical document pdf", async () => {
        await setupTransformations(["persons", "pedagogical_documents"])
        await setupTransfers(["persons"])
        await positiveTransferSnapshotTest(
            "pedagogical_documents/pdf",
            undefined,
            {
                "path": "/integration-test/data/paikky_document/pdf"
            }
        )
    })

    xit("should return oid updated daycares", async () => {
        const vardaUnitExpectation = { created_at: expect.any(String), uploaded_at: expect.any(String) }
        const updateExpectation = {
            daycare: [
                daycareExpectation,
                daycareExpectation
            ],
            varda_unit: [
                vardaUnitExpectation
            ]
        }

        await setupTransfers(["daycare"])
        await positiveTransferSnapshotTest(
            "daycare_oid",
            updateExpectation
        )
    })
})

const positiveTransferSnapshotTest = async (tableName: string, resultPattern?: any, baseQueryObject: Record<string, string> = {}) => {
    const queryObject = {
        ...baseQueryObject,
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
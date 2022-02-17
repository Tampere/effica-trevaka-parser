// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import express from "express"
import { transferAbsences } from "../transfer/absence"
import { transferApplicationData } from "../transfer/application"
import { transferAssistanceActionsData } from "../transfer/assistance-actions"
import { transferAssistanceNeedsData } from "../transfer/assistance-needs"
import { transferBackupCares } from "../transfer/backup-cares"
import { transferChildAttendances } from "../transfer/child-attendances"
import { transferDaycareData } from "../transfer/daycare"
import { transferDaycareOidData } from "../transfer/daycare-oid"
import { transferDepartmentData } from "../transfer/departments"
import { transferUnitManagerData } from "../transfer/evaka-unit-manager"
import { transferFamiliesData } from "../transfer/families"
import { transferFeeAlterationsData } from "../transfer/fee-alterations"
import { transferFeeDecisionData } from "../transfer/fee-decisions"
import { transferIncomeData } from "../transfer/income"
import { transferPersonData } from "../transfer/person"
import { transferPlacementsData } from "../transfer/placements"
import { transferVarda } from "../transfer/varda"
import { transferVoucherValueDecisions } from "../transfer/voucher-value-decisions"
import { MigrationOperation } from "../types/internal"
import { ErrorWithCause } from "../util/error"
import { time, timeEnd } from "../util/timing"

const dependencyOrder: MigrationOperation[] =
    [
        { name: "persons", function: transferPersonData },
        { name: "families", function: transferFamiliesData },
        { name: "assistance_needs", function: transferAssistanceNeedsData },
        { name: "assistance_actions", function: transferAssistanceActionsData },
        { name: "income", function: transferIncomeData },
        // daycare transfers suspended after locking down daycare data in production
        //{ name: "unit_manager", function: transferUnitManagerData },
        //{ name: "daycare", function: transferDaycareData },
        { name: "departments", function: transferDepartmentData },
        { name: "placements", function: transferPlacementsData },
        { name: "fee_alterations", function: transferFeeAlterationsData },
        { name: "voucher_value_decisions", function: transferVoucherValueDecisions },
        { name: "fee_decisions", function: transferFeeDecisionData },
        { name: "application", function: transferApplicationData },
        { name: "absences", function: transferAbsences },
        { name: "backup_care", function: transferBackupCares },
        { name: "child_attendances", function: transferChildAttendances },
        { name: "daycare_oid", function: transferDaycareOidData }
    ]


const router = express.Router()
router.get("/daycare", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer daycare total ", undefined, "*")
    try {
        const results = await transferDaycareData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer daycare total ", undefined, "*")
})
router.get("/departments", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer departments total ", undefined, "*")
    try {
        const results = await transferDepartmentData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer departments total ", undefined, "*")
})
router.get("/persons", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer persons total ", undefined, "*")
    try {
        const results = await transferPersonData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer persons total ", undefined, "*")
})
router.get("/families", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer families total ", undefined, "*")
    try {
        const results = await transferFamiliesData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer families total ", undefined, "*")
})
router.get("/assistance_needs", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer assistance needs total ", undefined, "*")
    try {
        const results = await transferAssistanceNeedsData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer assistance needs total ", undefined, "*")
})
router.get("/assistance_actions", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer assistance actions total ", undefined, "*")
    try {
        const results = await transferAssistanceActionsData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer assistance actions total ", undefined, "*")
})
router.get("/application", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer application total ", undefined, "*")
    try {
        const results = await transferApplicationData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer application total ", undefined, "*")
})
router.get("/placements", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer families total ", undefined, "*")
    try {
        const results = await transferPlacementsData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer families total ", undefined, "*")
})
router.get("/fee_alterations", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer fee alterations total ", undefined, "*")
    try {
        const results = await transferFeeAlterationsData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer fee alterations total ", undefined, "*")
})
router.get("/voucher_value_decisions", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer voucher value decisions total ", undefined, "*")
    try {
        const results = await transferVoucherValueDecisions(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer voucher value decisions total ", undefined, "*")
})
router.get("/fee_decisions", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer fee decisions total ", undefined, "*")
    try {
        const results = await transferFeeDecisionData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer fee decisions total ", undefined, "*")
})
router.get("/absences", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer absences total ", undefined, "*")
    try {
        const results = await transferAbsences(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer absences total ", undefined, "*")
})
router.get("/backup_cares", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer backup cares total ", undefined, "*")
    try {
        const results = await transferBackupCares(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer backup cares total ", undefined, "*")
})
router.get("/child_attendances", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer child attendances total ", undefined, "*")
    try {
        const results = await transferChildAttendances(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer child attendances total ", undefined, "*")
})
router.get("/unit_manager", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer unit managers total ", undefined, "*")
    try {
        const results = await transferUnitManagerData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer unit managers total ", undefined, "*")
})

router.get("/income", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer income total ", undefined, "*")
    try {
        const results = await transferIncomeData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer income total ", undefined, "*")
})

router.get("/daycare_oid", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer daycare varda ids total ", undefined, "*")
    try {
        const results = await transferDaycareOidData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer daycare varda ids total ", undefined, "*")
})

router.get("/varda", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer varda total ", undefined, "*")
    try {
        const results = await transferVarda(returnAll)
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer varda total ", undefined, "*")
})


router.get("/", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer all total ", undefined, "*")
    const results: Record<string, any> = {}
    let status = 200
    for (let operation of dependencyOrder) {
        try {
            results[operation.name] = await operation.function(returnAll)
        } catch (error) {
            results[operation.name] = error
            status = 500
            break
        }
    }

    res.status(status).json(results)

    timeEnd("**** Transfer all total ", undefined, "*")
})

export default router
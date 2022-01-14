// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import express from "express"
import { transformApplicationData } from "../transform/application"
import { cleanupData } from "../transform/cleanup"
import { transformDailyJournalsData } from "../transform/daily-journals"
import { transformDepartmentData } from "../transform/departments"
import { transformFamilyData } from "../transform/families"
import { transformFeeDeviationsData } from "../transform/fee-deviations"
import { transformIncomeData } from "../transform/income"
import { transformPayDecisionData } from "../transform/pay-decisions"
import { transformPersonData } from "../transform/person"
import { transformPlacementsData } from "../transform/placements"
import { transformSpecialMeansData } from "../transform/special-means"
import { transformSpecialNeedsData } from "../transform/special-needs"
import { transformTimestampsData } from "../transform/timestamps"
import { transformVoucherValueDecisionData } from "../transform/voucher-value-decisions"
import { MigrationOperation } from "../types/internal"
import { ErrorWithCause } from "../util/error"
import { time, timeEnd } from "../util/timing"

const dependencyOrder: MigrationOperation[] =
    [
        { name: "persons", function: transformPersonData },
        { name: "families", function: transformFamilyData },
        { name: "special_needs", function: transformSpecialNeedsData },
        { name: "special_means", function: transformSpecialMeansData },
        { name: "income", function: transformIncomeData },
        { name: "departments", function: transformDepartmentData },
        { name: "placements", function: transformPlacementsData },
        { name: "feedeviations", function: transformFeeDeviationsData },
        { name: "application", function: transformApplicationData },
        { name: "voucher_value_decisions", function: transformVoucherValueDecisionData },
        { name: "pay_decisions", function: transformPayDecisionData },
        { name: "daily_journals", function: transformDailyJournalsData },
        { name: "timestamps", function: transformTimestampsData },
        { name: "cleanup", function: cleanupData },
    ]

const router = express.Router();
router.get("/persons", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transform persons total ", undefined, "*")
    try {
        const results = await transformPersonData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transform persons total ", undefined, "*")
})

router.get("/application", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transform application total ", undefined, "*")
    try {
        const results = await transformApplicationData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transform application total ", undefined, "*")
})

router.get("/families", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transform families total ", undefined, "*")
    try {
        const results = await transformFamilyData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transform families total ", undefined, "*")
})

router.get("/special_needs", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transform special needs total ", undefined, "*")
    try {
        const results = await transformSpecialNeedsData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transform special needs total ", undefined, "*")
})

router.get("/special_means", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transform special means total ", undefined, "*")
    try {
        const results = await transformSpecialMeansData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transform special means total ", undefined, "*")
})

router.get("/departments", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transform departments total ", undefined, "*")
    try {
        const results = await transformDepartmentData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transform departments total ", undefined, "*")
})

router.get("/placements", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transform placements total ", undefined, "*")
    try {
        const results = await transformPlacementsData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transform placements total ", undefined, "*")
})

router.get("/feedeviations", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transform fee deviations total ", undefined, "*")
    try {
        const results = await transformFeeDeviationsData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transform fee deviations total ", undefined, "*")
})

router.get("/income", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transform income total ", undefined, "*")
    try {
        const results = await transformIncomeData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transform income total ", undefined, "*")
})

router.get("/voucher_value_decisions", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transform voucher value decisions total ", undefined, "*")
    try {
        const results = await transformVoucherValueDecisionData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transform voucher value decisions total ", undefined, "*")
})

router.get("/pay_decisions", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transform pay decisions total ", undefined, "*")
    try {
        const results = await transformPayDecisionData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transform pay decisions total ", undefined, "*")
})

router.get("/daily_journals", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transform daily journals total ", undefined, "*")
    try {
        const results = await transformDailyJournalsData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transform daily journals total ", undefined, "*")
})

router.get("/timestamps", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transform timestamps total ", undefined, "*")
    try {
        const results = await transformTimestampsData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transform timestamps total ", undefined, "*")
})

router.get("/cleanup", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Cleanup total ", undefined, "*")
    try {
        const results = await cleanupData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        console.log(err)
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Cleanup total ", undefined, "*")
})

//run all transforms in dependency order in SEPARATE TRANSACTIONS, stops at first error
router.get("/", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transform all total ", undefined, "*")
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

    timeEnd("**** Transform all total ", undefined, "*")
})


export default router
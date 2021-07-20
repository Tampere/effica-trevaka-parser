import express from "express";
import { transformApplicationData } from "../transform/application";
import { transformDepartmentData } from "../transform/departments";
import { transformFamilyData } from "../transform/families";
import { transformIncomeData } from "../transform/income";
import { transformPersonData } from "../transform/person";
import { ErrorWithCause } from "../util/error";
import { time, timeEnd } from "../util/timing";

const router = express.Router();
router.get("/person", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transform person total ", undefined, "*")
    try {
        const results = await transformPersonData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transform person total ", undefined, "*")
})

router.get("/application", async (req, res, next) => {
    time("**** Transform application total ", undefined, "*")
    try {
        await transformApplicationData()
        res.status(200)
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


export default router
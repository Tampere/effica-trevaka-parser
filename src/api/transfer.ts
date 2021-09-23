import express from "express";
import { transferFamiliesData } from "../transfer/families";
import { transferDaycareData } from "../transfer/daycare";
import { transferDepartmentData } from "../transfer/departments";
import { transferPersonData } from "../transfer/person";
import { transferUnitManagerData } from "../transfer/evaka-unit-manager";
import { ErrorWithCause } from "../util/error";
import { time, timeEnd } from "../util/timing";
import { transferPlacementsData } from "../transfer/placements";

const router = express.Router();
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
router.get("/person", async (req, res, next) => {
    const returnAll = req.query.returnAll === "true"
    time("**** Transfer person total ", undefined, "*")
    try {
        const results = await transferPersonData(returnAll)
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Transfer operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transfer person total ", undefined, "*")
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
router.get("/evaka_unit_manager", async (req, res, next) => {
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



export default router
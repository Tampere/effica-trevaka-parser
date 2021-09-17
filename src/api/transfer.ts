import express from "express";
import { transferPersonData } from "../transfer/person";
import { ErrorWithCause } from "../util/error";
import { time, timeEnd } from "../util/timing";

const router = express.Router();
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




export default router
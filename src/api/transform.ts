import express from "express";
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

export default router
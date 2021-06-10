import express from "express";
import { time, timeEnd } from "../timing";
import { ErrorWithCause } from "../util";

const router = express.Router();
router.get("/person", async (req, res, next) => {
    time("**** Transform person total ", undefined, "*")

    try {

    } catch (err) {
        next(new ErrorWithCause(`Transform operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Transform person total ", undefined, "*")
})

export default router
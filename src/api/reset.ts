import express from "express";
import { resetEvakaMigratedData } from "../db/evaka";
import { ErrorWithCause } from "../util/error";

const router = express.Router();
router.get("/evaka", async (req, res, next) => {
    try {
        const results = await resetEvakaMigratedData()
        res.status(200).json("Reset successful, migration targets truncated")
    } catch (err) {
        next(new ErrorWithCause(`Evaka migration data reset operation, transaction rolled back:`, err))
    }
})

export default router
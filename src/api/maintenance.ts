// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later


import express from "express";
import { resetEvakaMigratedData, vacuumAnalyzeEvaka } from "../db/evaka";
import { ErrorWithCause } from "../util/error";


const router = express.Router();
router.get("/reset-evaka", async (req, res, next) => {
    try {
        const results = await resetEvakaMigratedData()
        res.status(200).json("Reset successful, migration targets truncated")
    } catch (err) {
        next(new ErrorWithCause(`Evaka migration data reset operation, transaction rolled back:`, err))
    }
})

router.get("/vacuum-analyze", async (req, res, next) => {
    try {
        const results = await vacuumAnalyzeEvaka()
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Vacuum analyze resulted in error:`, err))
    }
})


export default router
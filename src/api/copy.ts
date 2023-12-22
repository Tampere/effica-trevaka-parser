// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later


import express from "express";
import { copyDaycaresFromEvaka } from "../db/evaka";
import { ErrorWithCause } from "../util/error";


const router = express.Router();
router.get("/um-and-daycare", async (req, res, next) => {
    try {
        const results = await copyDaycaresFromEvaka()
        res.status(200).json(results)
    } catch (err) {
        next(new ErrorWithCause(`Evaka migration copy operation, transaction rolled back:`, err))
    }
})

export default router
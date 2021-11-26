// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import express from "express"
import { importFileData } from "../import/service"
import { readFilesFromDir } from "../io/io"
import { FileDescriptor, ImportOptions } from "../types"
import { ErrorWithCause } from "../util/error"
import { time, timeEnd } from "../util/timing"

const router = express.Router();
router.get("/", async (req, res, next) => {
    time("**** Import total ", undefined, "*")
    const reqPath = req.query.path ?? "/xml"
    const tableName = req.query.tableName
    const basePath = `${__dirname}/../..`
    const path = basePath + reqPath
    const importOptions: ImportOptions = {
        path,
        returnAll: req.query.returnAll === "true",
        importTarget: typeof tableName === "string" ? tableName : undefined
    }
    try {
        const files: FileDescriptor[] = await readFilesFromDir(importOptions)
        const importResult = await importFileData(files, importOptions)
        res.status(200).json(importResult)
    } catch (err) {
        next(new ErrorWithCause(`Import operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Import total ", undefined, "*")
})

export default router
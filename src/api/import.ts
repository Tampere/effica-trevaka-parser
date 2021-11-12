// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import express from "express"
import { config } from "../config"
import { executePostImportFixes, importFileData } from "../import/service"
import { readFilesFromDir } from "../io/io"
import { postImportFixes } from "../mapping/citySpecific"
import { FileDescriptor, ImportOptions } from "../types"
import { ErrorWithCause } from "../util/error"
import { time, timeEnd } from "../util/timing"

const router = express.Router();
router.get("/", async (req, res, next) => {
    time("**** Import total ", undefined, "*")
    const reqPath = req.query.path ?? "/xml"
    const basePath = `${__dirname}/../..`
    const path = basePath + reqPath
    const importOptions: ImportOptions = { path, returnAll: req.query.returnAll === "true" }
    try {
        const files: FileDescriptor[] = await readFilesFromDir(path)
        const importResult = await importFileData(files, importOptions)
        res.status(200).json(importResult)
    } catch (err) {
        next(new ErrorWithCause(`Import operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Import total ", undefined, "*")
})

router.get("/fix", async (req, res, next) => {
    const cityFixScripts = postImportFixes[config.cityVariant] ?? []

    try {
        if (cityFixScripts.length > 0) {
            await executePostImportFixes(cityFixScripts)
            res.status(200).json(`Import fixes for city variant '${config.cityVariant}' successfully run`)
        } else {
            res.status(200).json(`No import fixes found for city variant: '${config.cityVariant}'`)
        }
    } catch (err) {
        next(new ErrorWithCause(`Import fixes for city variant '${config.cityVariant}' failed, transaction rolled back:`, err))
    }
})

export default router
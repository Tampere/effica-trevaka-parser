// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import express from "express"
import { config } from "../config"
import { importFileData } from "../import/service"
import { importVarda, importVardaPersonData } from "../import/varda"
import { readFilesFromDir, readFilesFromDirAsPartitions } from "../io/io"
import { FileDescriptor, ImportOptions, PartitionImportOptions } from "../types"
import { ErrorWithCause } from "../util/error"
import { time, timeEnd } from "../util/timing"
import { AxiosVardaClient } from "../util/varda-client"

const router = express.Router();
router.get("/", async (req, res, next) => {
    time("**** Import total ", undefined, "*")
    const reqPath = req.query.path ?? "/xml"
    const importTarget = req.query.importTarget
    const basePath = `${__dirname}/../..`
    const path = basePath + reqPath
    const importOptions: ImportOptions = {
        path,
        returnAll: req.query.returnAll === "true",
        importTarget: typeof importTarget === "string" ? importTarget : undefined
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

router.get("/partition", async (req, res, next) => {
    time("**** Import total ", undefined, "*")
    const reqPath = req.query.path ?? "/xml"
    const importTarget = req.query.importTarget
    const basePath = `${__dirname}/../..`
    const path = basePath + reqPath
    const maxBufferSize = req.query.bufferSize ?? config.defaultPartitionBufferSize
    const importOptions: PartitionImportOptions = {
        path,
        bufferSize: +maxBufferSize,
        importTarget: typeof importTarget === "string" ? importTarget : "no target set"
    }
    try {
        const importResult = await readFilesFromDirAsPartitions(importOptions)
        res.status(200).json(importResult)
    } catch (err) {
        next(new ErrorWithCause(`Import operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Import total ", undefined, "*")
})

router.get("/varda", async (req, res, next) => {
    time("**** Import total ", undefined, "*");
    try {
        const importResult = await importVarda(new AxiosVardaClient());
        res.status(200).json(importResult);
    } catch (err) {
        next(
            new ErrorWithCause(
                `Import operation failed, transaction rolled back:`,
                err
            )
        );
    }
    timeEnd("**** Import total ", undefined, "*");
});

router.get("/varda/person", async (req, res, next) => {
    time("**** Import total ", undefined, "*");
    try {
        const importResult = await importVardaPersonData(new AxiosVardaClient());
        res.status(200).json(importResult);
    } catch (err) {
        next(
            new ErrorWithCause(
                `Import operation failed, transaction rolled back:`,
                err
            )
        );
    }
    timeEnd("**** Import total ", undefined, "*");
});

export default router
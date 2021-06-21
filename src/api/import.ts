import express from "express"
import { importXmlData } from "../import/service"
import { readFilesFromDir } from "../io/io"
import { FileDescriptor, ImportOptions } from "../types"
import { time, timeEnd } from "../util/timing"
import { ErrorWithCause } from "../util/error"

const router = express.Router();
router.get("/", async (req, res, next) => {
    time("**** Import total ", undefined, "*")
    const reqPath = req.query.path ?? "/xml"
    const basePath = `${__dirname}/../..`
    const path = basePath + reqPath
    const importOptions: ImportOptions = { path, returnAll: req.query.returnAll === "true" }
    try {
        const files: FileDescriptor[] = await readFilesFromDir(path)
        const importResult = await importXmlData(files, importOptions)
        res.status(200).json(importResult)
    } catch (err) {
        next(new ErrorWithCause(`Import operation failed, transaction rolled back:`, err))
    }
    timeEnd("**** Import total ", undefined, "*")
})

export default router
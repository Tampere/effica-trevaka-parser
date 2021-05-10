import express from "express"
import { readFilesFromDir } from "../io"
import { FileDescriptor, ImportOptions } from "../types"
import { importXmlData } from "../service";
import { time, timeEnd } from "../timing"
import { ErrorWithCause } from "../util";

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
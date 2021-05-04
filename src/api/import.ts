import express from "express"
import { readFilesFromDir } from "../io"
import { FileDescriptor, TableDescriptor, ImportOptions } from "../types"
import { createTables, insertData } from "../service";
import { time, timeEnd } from "../timing"

const router = express.Router();
router.get("/", async (req, res) => {
    time("**** Import total ", undefined, "*")
    const reqPath = req.query.path ?? "/xml"
    const basePath = `${__dirname}/../..`
    const path = basePath + reqPath
    const importOptions: ImportOptions = { path, returnAll: req.query.returnAll === "true" }
    try {
        const files: FileDescriptor[] = await readFilesFromDir(path)
        const tables: TableDescriptor[] = files.map(f => f.table)
        const createdTables = await createTables(tables)
        time("** Data inserts total")
        const tableInserts: any[] = [];
        for await (const f of files) {
            time(`Table '${f.table.tableName}' inserts`)
            const insertResult = await insertData(f.table, f.data, importOptions)
            timeEnd(`Table '${f.table.tableName}' inserts`)
            tableInserts.push(insertResult)
        }
        timeEnd("** Data inserts total")
        res.status(200).json({ tables: createdTables, inserts: tableInserts })
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
    timeEnd("**** Import total ", undefined, "*")
})

export default router
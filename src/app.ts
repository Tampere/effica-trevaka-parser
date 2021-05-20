import express, { NextFunction } from "express"
import importApi from "./api/import"
import checkApi from "./api/check"
import { ErrorWithCause } from "./util"

const app: express.Application = express()

const errorHandler = (err: ErrorWithCause, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(500).send(err.stack + "\n")
}

app.use(express.json());

app.use("/import", importApi)
app.use("/check", checkApi)
app.use(errorHandler)

export default app
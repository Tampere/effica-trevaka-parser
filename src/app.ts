// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import express from "express"
import checkApi from "./api/check"
import importApi from "./api/import"
import maintenanceApi from "./api/maintenance"
import transferApi from "./api/transfer"
import transformApi from "./api/transform"
import { ErrorWithCause } from "./util/error"

const app: express.Application = express()

const errorHandler = (err: ErrorWithCause, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(500).send(err.stack + "\n")
}

app.use(express.json());

app.use("/import", importApi)
app.use("/check", checkApi)
app.use("/transform", transformApi)
app.use("/transfer", transferApi)
app.use("/maintenance", maintenanceApi)
app.use(errorHandler)

export default app
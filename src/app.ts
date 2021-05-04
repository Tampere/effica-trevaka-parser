import express from "express"
import importApi from "./api/import"
import checkApi from "./api/check"

const app: express.Application = express()

app.use(express.json());

app.use("/import", importApi)
app.use("/check", checkApi)

export default app
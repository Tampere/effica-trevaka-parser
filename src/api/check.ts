import express from "express"
import migrationDb from "../db/db"

const router = express.Router();

router.get("/", async (req, res) => {
    const dbDesignation = req.query.db ?? "migration"
    switch (dbDesignation) {
        case "production":
            res.status(501).json("Not implemented (yet)")
            break
        case "migration":
        default:
            migrationDb.query("SELECT 1;")
                .then(e => res.status(200).json("DB connection OK"))
                .catch(e => res.status(503).json("DB connection FAILED"))
            break
    }
})

export default router
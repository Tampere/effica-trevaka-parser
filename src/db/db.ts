import pgPromise from "pg-promise"
import { config } from "../config"

export const pgp = pgPromise({})
const migrationDb = pgp({ ...config.migrationDb })

export default migrationDb
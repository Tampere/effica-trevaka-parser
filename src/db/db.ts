import pgPromise from "pg-promise"
import { config } from "../config"

export const pgp = pgPromise({})

// date parsing seems to be scuffed, does local tz transformation but declares it UTC -> corrupts dates
//pgp.pg.types.setTypeParser(1082, dateParser)

const migrationDb = pgp({ ...config.migrationDb })

export default migrationDb
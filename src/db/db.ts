import pgPromise from "pg-promise"
import { config } from "../config"

export const pgp = pgPromise({})

// date parsing seems to be scuffed, interprets DB times as local times and shifts them -> corrupts dates
//pgp.pg.types.setTypeParser(1082, dateParser)

const migrationDb = pgp({ ...config.migrationDb })

export default migrationDb
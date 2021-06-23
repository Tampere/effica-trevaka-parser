export const config = {
    port: 3000,
    isTimed: process.env.ISTIMED?.toUpperCase() === "TRUE",
    migrationSchema: process.env.MIGRATION_SCHEMA,
    migrationDb: {
        host: process.env.PGHOST ?? "localhost",
        port: 5432,
        user: process.env.PGUSER ?? "postgres",
        password: process.env.PGPASSWORD ?? "postgres",
        database: process.env.PGDATABASE ?? "migration",
    },
    xmlParserOptions: {
        parseNodeValue: true,
        arrayMode: true,
        trimValues: true
    },
    csvParserOptions: {
        trim: true,
        delimiter: "|"
    }
}
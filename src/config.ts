export const config = {
    cityVariant: process.env.CITY_VARIANT ?? "tampere",
    port: process.env.PORT ?? 3000,
    isTimed: process.env.ISTIMED?.toUpperCase() === "TRUE",
    migrationSchema: process.env.MIGRATION_SCHEMA ?? "migration",
    extensionSchema: process.env.EXTENSION_SCHEMA ?? "ext",
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
        trimValues: true,
        parseTrueNumberOnly: true
    },
    csvParserOptions: {
        trim: true,
        delimiter: "|"
    }
}
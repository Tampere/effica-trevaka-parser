export const config = {
    port: 3000,
    isTimed: process.env.ISTIMED?.toUpperCase() === "TRUE",
    migrationSchema: undefined,
    migrationDb: {
        host: process.env.PGHOST ?? "localhost",
        port: 5432,
        user: process.env.PGUSER ?? "postgres",
        password: process.env.PGPASSWORD ?? "postgres",
        database: process.env.PGDATABASE ?? "migration",
    },
    xmlParserOptions: {
        parseNodeValue: true,
        arrayMode: true
    }
}
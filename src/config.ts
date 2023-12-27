// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

export const config = {
    cityVariant: process.env.CITY_VARIANT ?? "tampere",
    copyPersonsFromEvaka: process.env.COPY_PERSONS_FROM_EVAKA?.toUpperCase() === "TRUE",
    mockVtj: process.env.MOCK_VTJ?.toUpperCase() === "TRUE",
    port: process.env.PORT ?? 3000,
    isTimed: process.env.ISTIMED?.toUpperCase() === "TRUE",
    migrationSchema: process.env.MIGRATION_SCHEMA ?? "migration",
    extensionSchema: process.env.EXTENSION_SCHEMA ?? "ext",
    exclusionSuffix: "_exclusion",
    migrationDb: {
        host: process.env.PGHOST ?? "localhost",
        port: 5432,
        user: process.env.PGUSER ?? "postgres",
        password: process.env.PGPASSWORD ?? "postgres",
        database: process.env.PGDATABASE ?? "migration",
    },
    varda: {
        apiUrl: process.env.VARDA_API_URL,
        basicAuth: process.env.VARDA_BASIC_AUTH,
    },
    aws: {
        region: process.env.AWS_REGION ?? 'eu-west-1',
        s3: {
            endpoint: process.env.AWS_S3_ENDPOINT,
            bucket: process.env.AWS_S3_BUCKET,
        }
    },
    csvParserOptions: {
        trim: true,
        delimiter: "|"
    },
    defaultPartitionBufferSize: 60000, //line buffer for partitioned file reading and data persisting
    logResponses: process.env.LOG_RESPONSES?.toUpperCase() === "TRUE"
}
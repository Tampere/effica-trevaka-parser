# effica-trevaka-parser
Tool for facilitating Effica -> eVaka data migrations

Developed for assisting in the migration of early education data from the old education system to trevaka.

## Configuration
The parser provides some configuration options to make the tool usable in different environments:

| Environmental variable | Description                                                                                           | Default value |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ------------- |
| `MIGRATION_SCHEMA`     | The database schema used to create import and transformation tables                                   | `migration`   |
| `EXTENSION_SCHEMA`     | The database schema used to look for necessary database extensions (UUID generation, gist exclusions) | `ext`         |
| `ISTIMED`              | true/false for enabling per operation timing print outs to console                                    | `false`       |
| `PGHOST`               | The host of the migration database                                                                    | `localhost`   |
| `PGUSER`               | The user used in connecting to the migration database                                                 | `postgres`    |
| `PGDATABASE`           | The name of the database used for migration                                                           | `migration`   |
| `PGPASSWORD`           | The password used to connect to the migration database                                                | `postgres`    |

The necessary database objects for the default configuration on the accompanying docker db are created with the `init.sql` initialization script upon container composition. If using another database, configure parser to match its requirements.

## Integration tests

Start the included docker compose for integration testing DB:
```
docker-compose -f docker-compose-it-db.yml up
```

Run integration tests:
```
npm run integration-test
```
## Importing data

1. Place XML files of table data or CSV files of external data under a directory called `xml` under the project root.
   - this is the directory the application will read by default, individual requests can be configured to target different locations relative to project root
   - all data tables used in XML or CSV data must be typed and described in `src/mapping/sourceMapping.ts`
2. Prepare a Postgres DB and configure the connection under `migrationDb` in `src/config.ts`
3. Start the application with `npm start` 
4. Send a HTTP GET request to `http://localhost:3000/import`
   - following query strings are recognized:
     - `path`: directory path relative to project root to read for XML or CSV data, if missing, default path `/xml` will be used
     - `returnAll`: default false, can be set to true in order to receive all inserted data as JSON in the response (for testing with smaller imports) 

## Transforming imported data

1. Send a HTTP GET request to `http://localhost:3000/transform/<element>` where element is the target of the transformation
   - transformations have per element prerequisites for pre-existing imported and/or transformed data
   - following query strings are recognized:
     - `returnAll`: default false, can be set to true in order to receive all inserted data as JSON in the response (for testing with smaller imports)
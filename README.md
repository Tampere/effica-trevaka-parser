# effica-trevaka-parser
Tool for facilitating Effica -> eVaka data migrations

Developed for assisting in the migration of early education data from the old education system to trevaka.

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

1. Place XML files of table data under a directory called `xml` under the project root.
   - this is the directory the application will read by default, individual requests can be configured to target different locations relative to project root
   - all data tables used in XML data must be typed and described in `src/mapping.ts`
2. Prepare a Postgres DB and configure the connection under `migrationDb` in `src/config.ts`
3. Start the application with `npm start` 
4. Send a HTTP GET request to `http://localhost:3000/import`
   - following query strings are recognized:
     - `path`: directory path relative to project root to read for XML data, if missing, default path `/xml` will be used
     - `returnAll`: default false, can be set to true in order to receive all inserted data as JSON in the response (for testing with smaller imports) 

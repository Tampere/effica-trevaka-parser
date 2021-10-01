import migrationDb from "../db/db"
import { getExtensionSchemaPrefix, getMigrationSchemaPrefix, runQuery, wrapWithReturning } from "../util/queryTools"

export const transformFamilyData = async (returnAll: boolean = false) => {
    const childTableQuery =
        `
        DROP TABLE IF EXISTS ${getMigrationSchemaPrefix()}evaka_fridge_child CASCADE;
        CREATE TABLE ${getMigrationSchemaPrefix()}evaka_fridge_child (
            id UUID PRIMARY KEY DEFAULT ${getExtensionSchemaPrefix()}uuid_generate_v1mc(),
            child_id UUID NOT NULL,
            child_ssn TEXT NOT NULL,
            head_of_family UUID NOT NULL,
            hof_ssn TEXT NOT NULL,
            family_number INTEGER NOT NULL,
            start_date date NOT NULL,
            end_date date NOT NULL
        );
        `

    //no evaka-style conflict state for partnerships -> no overlap
    const partnerTableQuery =
        `
        DROP TABLE IF EXISTS ${getMigrationSchemaPrefix()}evaka_fridge_partner CASCADE;
        CREATE TABLE ${getMigrationSchemaPrefix()}evaka_fridge_partner (
            partnership_id uuid NOT NULL,
            person_id UUID NOT NULL,
            effica_ssn TEXT NOT NULL,
            indx smallint NOT NULL,
            family_number INTEGER NOT NULL,
            start_date date NOT NULL,
            end_date date,
            CONSTRAINT fridge_partner_pkey
		        PRIMARY KEY (partnership_id, indx),
            CONSTRAINT partnership_start_date_matches
		        EXCLUDE using gist (partnership_id with pg_catalog.=, start_date with pg_catalog.<>)
			        deferrable initially deferred,
            CONSTRAINT partnership_end_date_matches
                EXCLUDE using gist (partnership_id with =, end_date with <>)
                    deferrable initially deferred,
            CONSTRAINT unique_partnership_person UNIQUE (partnership_id, person_id)
        );
        `

    const childQueryPart =
        `
        INSERT INTO ${getMigrationSchemaPrefix()}evaka_fridge_child (head_of_family, hof_ssn, child_id, child_ssn, family_number, start_date, end_date)
        WITH hofs_in_families AS (
            SELECT DISTINCT f.familynbr, f.personid AS hof_ssn, p.id as person_id
            FROM ${getMigrationSchemaPrefix()}families f
                JOIN ${getMigrationSchemaPrefix()}evaka_person p
                    ON f.personid = p.effica_ssn
            WHERE f.roleinfamily = 'R'
        )
        SELECT
            hofs.person_id as head_of_family,
            hofs.hof_ssn, 
            p.id as child_id,
            p.effica_ssn as child_ssn,
            f.familynbr,
            f.startdate as start_date,
            COALESCE(f.enddate, 'infinity') as end_date
        FROM hofs_in_families hofs
            JOIN ${getMigrationSchemaPrefix()}families f
                ON f.familynbr = hofs.familynbr
            JOIN ${getMigrationSchemaPrefix()}evaka_person p
                ON f.personid = p.effica_ssn
        WHERE roleinfamily = 'B'
        `

    const partnerQueryPart =
        `
        INSERT INTO ${getMigrationSchemaPrefix()}evaka_fridge_partner (person_id, effica_ssn, partnership_id, family_number, start_date, end_date, indx)
        WITH partnerships AS (
            SELECT f.familynbr as family_number,
                ${getExtensionSchemaPrefix()}uuid_generate_v1mc() as partnership_id,
                max(startdate) filter ( where roleinfamily in ('S', 'R')) as start_date,
                min(enddate) filter ( where roleinfamily in ('S', 'R')) as end_date
            FROM ${getMigrationSchemaPrefix()}families f
            GROUP BY f.familynbr
            HAVING array_agg(roleinfamily) @> '{"S", "R"}'
        )
        SELECT p.id        as person_id,
            p.effica_ssn, 
            pr.partnership_id,
            f.familynbr,
            pr.start_date,
            pr.end_date,
            CASE f.roleinfamily
                WHEN 'R' THEN 1
                WHEN 'S' THEN 2
                END     as indx
        FROM ${getMigrationSchemaPrefix()}families f
            JOIN partnerships pr
                ON pr.family_number = f.familynbr
            JOIN ${getMigrationSchemaPrefix()}evaka_person p
                ON p.effica_ssn = f.personid
        WHERE f.roleinfamily in ('S', 'R')
        `

    const updateQueries =
        `
        DROP TABLE IF EXISTS ${getMigrationSchemaPrefix()}evaka_fridge_child_todo;
        CREATE TABLE ${getMigrationSchemaPrefix()}evaka_fridge_child_todo AS
        SELECT DISTINCT f1.*, 'OVERLAPPING' AS reason
        FROM ${getMigrationSchemaPrefix()}evaka_fridge_child f1
        JOIN ${getMigrationSchemaPrefix()}evaka_fridge_child f2 ON f1.child_id = f2.child_id
            AND f1.id != f2.id
            AND daterange(f1.start_date, f1.end_date, '[]') && daterange(f2.start_date, f2.end_date, '[]');
        INSERT INTO ${getMigrationSchemaPrefix()}evaka_fridge_child_todo
        SELECT *, 'START AFTER END'
        FROM ${getMigrationSchemaPrefix()}evaka_fridge_child
        WHERE start_date > end_date;
        DELETE FROM ${getMigrationSchemaPrefix()}evaka_fridge_child
        WHERE id IN (SELECT id FROM ${getMigrationSchemaPrefix()}evaka_fridge_child_todo);

        DROP TABLE IF EXISTS ${getMigrationSchemaPrefix()}evaka_fridge_partner_todo;
        CREATE TABLE ${getMigrationSchemaPrefix()}evaka_fridge_partner_todo AS
        SELECT DISTINCT f1.*, 'OVERLAPPING' AS reason
        FROM ${getMigrationSchemaPrefix()}evaka_fridge_partner f1
        JOIN ${getMigrationSchemaPrefix()}evaka_fridge_partner f2 ON f1.person_id = f2.person_id
            AND f1.partnership_id != f2.partnership_id
            AND f1.indx != f2.indx
            AND daterange(f1.start_date, f1.end_date, '[]') && daterange(f2.start_date, f2.end_date, '[]');
        INSERT INTO ${getMigrationSchemaPrefix()}evaka_fridge_partner_todo
        SELECT *, 'START AFTER END'
        FROM ${getMigrationSchemaPrefix()}evaka_fridge_partner
        WHERE start_date > end_date;
        DELETE FROM ${getMigrationSchemaPrefix()}evaka_fridge_partner
        WHERE (partnership_id, indx) IN (SELECT partnership_id, indx FROM ${getMigrationSchemaPrefix()}evaka_fridge_partner_todo);
        `;

    const childQuery = wrapWithReturning("evaka_fridge_child", childQueryPart, returnAll, ["family_number", "hof_ssn", "child_ssn"])
    const partnerQuery = wrapWithReturning("evaka_fridge_partner", partnerQueryPart, returnAll, ["family_number", "effica_ssn"])

    return await migrationDb.tx(async (t) => {
        await runQuery(childTableQuery, t)
        await runQuery(partnerTableQuery, t)
        const childResult = await runQuery(childQuery, t, true)
        const partnerResult = await runQuery(partnerQuery, t, true)
        await runQuery(updateQueries, t)
        return { child: childResult, partner: partnerResult }
    })

}
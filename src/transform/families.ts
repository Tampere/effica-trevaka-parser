import migrationDb from "../db/db"
import { getExtensionSchemaPrefix, getMigrationSchemaPrefix, runQuery, wrapWithReturning } from "../util/queryTools"

export const transformFamilyData = async (returnAll: boolean = false) => {
    const childTableQuery =
        `
        DROP TABLE IF EXISTS ${getMigrationSchemaPrefix()}evaka_fridge_child CASCADE;
        CREATE TABLE ${getMigrationSchemaPrefix()}evaka_fridge_child (
            child_id UUID NOT NULL,
            child_ssn TEXT NOT NULL,
            head_of_family UUID NOT NULL,
            hof_ssn TEXT NOT NULL,
            family_number INTEGER NOT NULL,
            start_date date NOT NULL,
            end_date date NOT NULL,
            CHECK (start_date <= end_date),
            CONSTRAINT fridge_child_no_overlap EXCLUDE USING gist (child_id WITH =, daterange(start_date, end_date, '[]') WITH &&),
            CONSTRAINT fridge_child_no_full_duplicates UNIQUE (child_id, head_of_family, start_date, end_date)
        );
        `

    //TODO: "monogamy" constraint allows only one entry per person id???
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
            end_date date NOT NULL,
            CHECK (start_date <= end_date),
            CONSTRAINT fridge_partner_pkey
		        PRIMARY KEY (partnership_id, indx),
	        --CONSTRAINT exclude$fridge_partner_enforce_monogamy
		    --    EXCLUDE using gist (person_id with pg_catalog.=),
            CONSTRAINT partnership_end_date_matches
		        EXCLUDE using gist (partnership_id with pg_catalog.=, end_date with pg_catalog.<>)
			        deferrable initially deferred,
            CONSTRAINT partnership_start_date_matches
		        EXCLUDE using gist (partnership_id with pg_catalog.=, start_date with pg_catalog.<>)
			        deferrable initially deferred,
            CONSTRAINT fridge_partner_no_overlap EXCLUDE USING gist (person_id WITH =, daterange(start_date, end_date, '[]') WITH &&),
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
            f.enddate as end_date
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
            SELECT f.familynbr as family_number, ${getExtensionSchemaPrefix()}uuid_generate_v1mc() as partnership_id
            FROM ${getMigrationSchemaPrefix()}families f
            GROUP BY f.familynbr
            HAVING array_agg(roleinfamily) @> '{"S", "R"}'
        )
        SELECT p.id        as person_id,
            p.effica_ssn, 
            pr.partnership_id,
            f.familynbr,
            f.startdate as start_date,
            f.enddate   as end_date,
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

    const childQuery = wrapWithReturning("evaka_fridge_child", childQueryPart, returnAll, ["family_number", "hof_ssn", "child_ssn"])
    const partnerQuery = wrapWithReturning("evaka_fridge_partner", partnerQueryPart, returnAll, ["family_number", "effica_ssn"])

    return await migrationDb.tx(async (t) => {
        await runQuery(childTableQuery, t)
        await runQuery(partnerTableQuery, t)
        const childResult = await runQuery(childQuery, t, true)
        const partnerResult = await runQuery(partnerQuery, t, true)
        return { child: childResult, partner: partnerResult }
    })

}
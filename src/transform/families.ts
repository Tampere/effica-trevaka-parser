// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

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
            end_date DATE NOT NULL
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
        INSERT INTO ${getMigrationSchemaPrefix()}evaka_fridge_child (hof_ssn, head_of_family, child_ssn, child_id, start_date, end_date, family_number)
        WITH hofs AS (
            SELECT hof.personid  AS effica_ssn,
                hof.startdate AS start_date,
                hof.enddate   AS end_date,
                hof.familynbr AS family_number,
                p.id          AS person_id
            FROM ${getMigrationSchemaPrefix()}filtered_families_v hof
            JOIN ${getMigrationSchemaPrefix()}evaka_person p
                ON hof.personid = p.effica_ssn
            WHERE hof.roleinfamily = 'R'
        ),
        children AS (
            SELECT child.personid                                                             AS effica_ssn,
                child.startdate                                                            AS start_date,
                COALESCE(child.enddate,
                        (p.date_of_birth) + INTERVAL '18 years' - INTERVAL '1 day')::date AS end_date,
                child.familynbr                                                            AS family_number,
                p.id                                                                       AS person_id
            FROM ${getMigrationSchemaPrefix()}filtered_families_v child
                JOIN ${getMigrationSchemaPrefix()}evaka_person p
                    ON child.personid = p.effica_ssn
            WHERE child.roleinfamily = 'B'
        )
         SELECT h.effica_ssn                         AS hof_ssn,
                h.person_id                          AS head_of_family,
                c.effica_ssn                         AS child_ssn,
                c.person_id                          AS child_id,
                GREATEST(h.start_date, c.start_date) AS start_date,
                LEAST(h.end_date, c.end_date)        AS end_date,
                h.family_number
         FROM hofs h
            JOIN children c
                ON h.family_number = c.family_number
                    AND GREATEST(h.start_date, c.start_date) <= LEAST(h.end_date, c.end_date)
                    AND daterange(h.start_date, h.end_date, '[]') &&
                        daterange(c.start_date, c.end_date, '[]')
        `

    const partnerQueryPart =
        `
        INSERT INTO ${getMigrationSchemaPrefix()}evaka_fridge_partner (person_id, partnership_id, start_date, end_date, indx, family_number, effica_ssn)
        WITH partnerships AS (
            SELECT hof.personid                                   AS hof_ssn,
                partner.personid                                  AS partner_ssn,
                ${getExtensionSchemaPrefix()}uuid_generate_v1mc() AS partnership_id,
                GREATEST(hof.startdate, partner.startdate)        AS start_date,
                LEAST(hof.enddate, partner.enddate)               AS end_date,
                hof.familynbr                                     AS family_number
            FROM ${getMigrationSchemaPrefix()}filtered_families_v hof
                JOIN ${getMigrationSchemaPrefix()}filtered_families_v partner
                    ON partner.familynbr = hof.familynbr
                        AND daterange(hof.startdate, hof.enddate, '[]') && daterange(partner.startdate, partner.enddate, '[]')
                        AND hof.roleinfamily = 'R'
                        AND partner.roleinfamily = 'S'
        ) 
        SELECT ep.id   AS person_id,
            ps.partnership_id,
            ps.start_date,
            ps.end_date,
            1          AS indx,
            ps.family_number,
            ps.hof_ssn AS effica_ssn
        FROM partnerships ps
            JOIN ${getMigrationSchemaPrefix()}evaka_person ep ON ps.hof_ssn = ep.effica_ssn
        UNION
        SELECT ep.id       AS person_id,
            ps.partnership_id,
            ps.start_date,
            ps.end_date,
            2              AS indx,
            ps.family_number,
            ps.partner_ssn AS effica_ssn
        FROM partnerships ps
            JOIN ${getMigrationSchemaPrefix()}evaka_person ep ON ps.partner_ssn = ep.effica_ssn
        `

    const updateQueries =
        `
        DROP TABLE IF EXISTS ${getMigrationSchemaPrefix()}evaka_fridge_child_todo;
        CREATE TABLE ${getMigrationSchemaPrefix()}evaka_fridge_child_todo AS
        SELECT DISTINCT f1.*, 'OVERLAPPING' AS reason
        FROM ${getMigrationSchemaPrefix()}evaka_fridge_child f1
        JOIN ${getMigrationSchemaPrefix()}evaka_fridge_child f2 ON f1.child_id = f2.child_id
            AND f1.id != f2.id
            AND f1.end_date >= f1.start_date AND f2.end_date >= f2.start_date
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
            AND (f1.end_date >= f1.start_date OR f1.end_date IS NULL)
            AND (f2.end_date >= f2.start_date OR f2.end_date IS NULL)
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
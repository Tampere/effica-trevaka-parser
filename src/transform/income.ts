// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { config } from "../config"
import migrationDb from "../db/db"
import { citySpecificIncomeMappings } from "../mapping/citySpecific"
import { CitySpecificIncomeMapping } from "../types/mappings"
import { createSqlConditionalForCoefficients, createSqlConditionalForIncomeCodes, createTotalSumClauseForIncomeTypes, getExtensionSchemaPrefix, getMigrationSchemaPrefix, runQuery, wrapWithReturning } from "../util/queryTools"

export const transformIncomeData = async (returnAll: boolean = false) => {
    const incomeMapping: CitySpecificIncomeMapping = citySpecificIncomeMappings[config.cityVariant]
    if (!incomeMapping) {
        throw new Error(`No income mapping found for city variant ${config.cityVariant}`)
    }

    const incomeTableQuery =
        `
        DROP TABLE IF EXISTS ${getMigrationSchemaPrefix()}evaka_income CASCADE;
        CREATE TABLE ${getMigrationSchemaPrefix()}evaka_income (
            id UUID NOT NULL DEFAULT ${getExtensionSchemaPrefix()}uuid_generate_v1mc()
                constraint pk$income
                    primary key,
            person_id uuid not null
                constraint fk$person_id
                    references ${getMigrationSchemaPrefix()}evaka_person
                        on delete cascade,
            person_ssn text not null,
            data jsonb not null,
            valid_from date not null,
            valid_to date,
            income_total int,
            notes text default ''::text not null,
            effect text default 'INCOME' not null,
            is_entrepreneur boolean default false not null,
            application_id uuid,
            constraint no_overlapping_income
                exclude using gist (person_id WITH pg_catalog.=, daterange(valid_from, COALESCE(valid_to, '2099-12-31'::date), '[]') WITH &&)
        );
        `

    const incomeFunctionQuery =
        `
        DROP FUNCTION IF EXISTS pg_temp.coefficient_multiplier(text);
        CREATE FUNCTION pg_temp.coefficient_multiplier(text) RETURNS numeric AS $$
        SELECT
            CASE $1
            ${createSqlConditionalForCoefficients(incomeMapping.coefficientMap)}
            ELSE 0
            END
        $$ LANGUAGE SQL;

        DROP FUNCTION IF EXISTS pg_temp.summed_income_data(jsonb);
        CREATE FUNCTION pg_temp.summed_income_data(jsonb) RETURNS int AS $$
        SELECT (
            0
            ${createTotalSumClauseForIncomeTypes(incomeMapping.incomeTypeMap)}
            )::int
        $$ LANGUAGE SQL;
        `

    const incomeQueryPart =
        `
        INSERT INTO ${getMigrationSchemaPrefix()}evaka_income (person_id, person_ssn, data, effect, valid_from, valid_to, income_total, application_id)
        WITH data_agg AS
            (SELECT
                i.personid as person_ssn,    
                (CASE
                    WHEN i.maxincome THEN '{}'::jsonb
                    WHEN i.incomemissing THEN '{}'::jsonb
                    WHEN count(ir.*) > 0 THEN json_object_agg(
                    (CASE ir.incometype
                        ${createSqlConditionalForIncomeCodes(incomeMapping.incomeTypeMap)}
                        ELSE 'LOL'
                    END),
                    json_build_object(
                        'amount', (ir.summa * 100)::int,
                        'coefficient', (CASE ir.incomeperiod
                        ${createSqlConditionalForIncomeCodes(incomeMapping.incomePeriodMap)}
                        ELSE 'BAL'
                        END)
                    )
                    )::jsonb
                    WHEN count(ir.*) = 0 AND i.summa > 0 THEN json_build_object(
                    'MAIN_INCOME', json_build_object(
                        'amount', (i.summa * 100)::int,
                        'coefficient', 'MONTHLY_NO_HOLIDAY_BONUS'
                    )
                    )::jsonb
                    ELSE '{}'::jsonb
                END) AS data,
                i.startdate AS valid_from,
                i.enddate AS valid_to,
                (CASE
                    WHEN i.maxincome THEN 'MAX_FEE_ACCEPTED'::text
                    WHEN i.incomemissing THEN 'INCOMPLETE'::text
                    ELSE 'INCOME'::text
                END) AS effect,
                (i.summa * 100)::int AS income_total
            FROM ${getMigrationSchemaPrefix()}income i
            LEFT JOIN ${getMigrationSchemaPrefix()}filtered_incomerows_v ir
                    ON i.personid = ir.personid 
                        AND (
                            -- some incomerows seems to be broken (enddate is before startdate where it should be null)
                            (ir.startdate > ir.enddate AND i.startdate = ir.startdate AND i.enddate IS NULL)
                            OR
                            ((ir.enddate IS NULL OR ir.enddate > ir.startdate) AND daterange(i.startdate, i.enddate, '[]') && daterange(ir.startdate, ir.enddate, '[]'))
                        )
            GROUP BY i.personid, i.maxincome, i.incomemissing, i.startdate, i.enddate, i.summa
        ) 
        SELECT
            ep.id as person_id,
            da.person_ssn,
            (CASE
                WHEN da.income_total - pg_temp.summed_income_data(da.data) = 0 THEN data
                ELSE json_build_object(
                  'MAIN_INCOME',
                  json_build_object('amount', da.income_total, 'coefficient', 'MONTHLY_NO_HOLIDAY_BONUS')
                )::jsonb
            END) AS data,
            da.effect,
            da.valid_from,
            da.valid_to,
            da.income_total,
            null -- application_id, no data available and quite pointless information as evaka will remove this link on income edit
        FROM data_agg da
            JOIN ${getMigrationSchemaPrefix()}evaka_person ep
                ON da.person_ssn = ep.effica_ssn
        `

    const incomeQuery = wrapWithReturning("evaka_income", incomeQueryPart, returnAll, ["person_ssn"])

    return await migrationDb.tx(async (t) => {
        await runQuery(incomeTableQuery, t)
        await runQuery(incomeFunctionQuery, t)
        return await runQuery(incomeQuery, t, true)
    })

}
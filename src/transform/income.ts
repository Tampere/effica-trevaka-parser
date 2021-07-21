import migrationDb from "../db/db"
import { incomeCoefficientMultipliers as coeff } from "../mapping/coefficients"
import { getExtensionSchema, getMigrationSchema, runQuery, wrapWithReturning } from "../util/queryTools"

export const transformIncomeData = async (returnAll: boolean = false) => {
    //TODO: add application id FK constraint?
    const incomeTableQuery =
        `
        DROP TABLE IF EXISTS ${getMigrationSchema()}evaka_income CASCADE;
        CREATE TABLE ${getMigrationSchema()}evaka_income (
            id UUID NOT NULL DEFAULT ${getExtensionSchema()}uuid_generate_v1mc()
                constraint pk$income
                    primary key,
            person_id uuid not null
                constraint fk$person_id
                    references ${getMigrationSchema()}evaka_person,
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
        DROP FUNCTION IF EXISTS ${getMigrationSchema()}coefficient_multiplier(text);
        CREATE FUNCTION ${getMigrationSchema()}coefficient_multiplier(text) RETURNS numeric AS $$
        SELECT
            CASE $1
            WHEN 'MONTHLY_WITH_HOLIDAY_BONUS' THEN ${coeff["MONTHLY_WITH_HOLIDAY_BONUS"]}
            WHEN 'MONTHLY_NO_HOLIDAY_BONUS' THEN ${coeff["MONTHLY_NO_HOLIDAY_BONUS"]}
            WHEN 'BI_WEEKLY_WITH_HOLIDAY_BONUS' THEN ${coeff["BI_WEEKLY_WITH_HOLIDAY_BONUS"]}
            WHEN 'BI_WEEKLY_NO_HOLIDAY_BONUS' THEN ${coeff["BI_WEEKLY_NO_HOLIDAY_BONUS"]}
            WHEN 'YEARLY' THEN ${coeff["YEARLY"]}
            ELSE 0
            END
        $$ LANGUAGE SQL;

        DROP FUNCTION IF EXISTS ${getMigrationSchema()}summed_income_data(jsonb);
        CREATE FUNCTION ${getMigrationSchema()}summed_income_data(jsonb) RETURNS int AS $$
        SELECT (
            0
            + COALESCE(($1->'PARENTAL_ALLOWANCE'->>'amount') :: int, 0) * ${getMigrationSchema()}coefficient_multiplier($1->'PARENTAL_ALLOWANCE'->>'coefficient')
            + COALESCE(($1->'SICKNESS_ALLOWANCE'->>'amount') :: int, 0) * ${getMigrationSchema()}coefficient_multiplier($1->'SICKNESS_ALLOWANCE'->>'coefficient')
            + COALESCE(($1->'ALIMONY'->>'amount') :: int, 0) * ${getMigrationSchema()}coefficient_multiplier($1->'ALIMONY'->>'coefficient')
            + COALESCE(($1->'PENSION'->>'amount') :: int, 0) * ${getMigrationSchema()}coefficient_multiplier($1->'PENSION'->>'coefficient')
            + COALESCE(($1->'HOME_CARE_ALLOWANCE'->>'amount') :: int, 0) * ${getMigrationSchema()}coefficient_multiplier($1->'HOME_CARE_ALLOWANCE'->>'coefficient')
            + COALESCE(($1->'OTHER_INCOME'->>'amount') :: int, 0) * ${getMigrationSchema()}coefficient_multiplier($1->'OTHER_INCOME'->>'coefficient')
            + COALESCE(($1->'MAIN_INCOME'->>'amount') :: int, 0) * ${getMigrationSchema()}coefficient_multiplier($1->'MAIN_INCOME'->>'coefficient')
            + COALESCE(($1->'SECONDARY_INCOME'->>'amount') :: int, 0) * ${getMigrationSchema()}coefficient_multiplier($1->'SECONDARY_INCOME'->>'coefficient')
            + COALESCE(($1->'UNEMPLOYMENT_BENEFITS'->>'amount') :: int, 0) * ${getMigrationSchema()}coefficient_multiplier($1->'UNEMPLOYMENT_BENEFITS'->>'coefficient')
            - COALESCE(($1->'ALL_EXPENSES'->>'amount') :: int, 0) * ${getMigrationSchema()}coefficient_multiplier($1->'ALL_EXPENSES'->>'coefficient')
            )::int
        $$ LANGUAGE SQL;
        `

    //TODO: add application id?
    const incomeQueryPart =
        `
        INSERT INTO ${getMigrationSchema()}evaka_income (person_id, person_ssn, data, effect, valid_from, valid_to, income_total)
        WITH data_agg AS
            (SELECT
                i.personid as person_ssn,    
                (CASE
                    WHEN i.maxincome THEN '{}'::jsonb
                    WHEN i.incomemissing THEN '{}'::jsonb
                    WHEN count(ir.*) > 0 THEN json_object_agg(
                    (CASE ir.incometype
                        WHEN 19 THEN 'PARENTAL_ALLOWANCE'
                        WHEN 20 THEN 'SICKNESS_ALLOWANCE'
                        WHEN 21 THEN 'ALIMONY'
                        WHEN 22 THEN 'PENSION'
                        WHEN 23 THEN 'HOME_CARE_ALLOWANCE'
                        WHEN 24 THEN 'OTHER_INCOME'
                        WHEN 25 THEN 'MAIN_INCOME'
                        WHEN 26 THEN 'SECONDARY_INCOME'
                        WHEN 27 THEN 'UNEMPLOYMENT_BENEFITS'
                        WHEN 28 THEN 'ALL_EXPENSES'
                        ELSE 'LOL'
                    END),
                    json_build_object(
                        'amount', (ir.summa * 100)::int,
                        'coefficient', (CASE ir.incomeperiod
                        WHEN 30 THEN 'MONTHLY_NO_HOLIDAY_BONUS'
                        WHEN 31 THEN 'YEARLY'
                        WHEN 32 THEN 'BI_WEEKLY_NO_HOLIDAY_BONUS'
                        WHEN 108 THEN 'MONTHLY_WITH_HOLIDAY_BONUS'
                        WHEN 110 THEN 'BI_WEEKLY_WITH_HOLIDAY_BONUS'
                        WHEN 416 THEN 'MONTHLY_WITH_HOLIDAY_BONUS'
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
            FROM ${getMigrationSchema()}income i
            LEFT JOIN ${getMigrationSchema()}incomerows ir 
                    ON i.personid = ir.personid 
                        AND daterange(i.startdate, i.enddate, '[]') && daterange(ir.startdate, ir.enddate, '[]')
            GROUP BY i.personid, i.maxincome, i.incomemissing, i.startdate, i.enddate, i.summa
        ) 
        SELECT
            ep.id as person_id,
            da.person_ssn,
            (CASE
                WHEN da.income_total - ${getMigrationSchema()}summed_income_data(da.data) = 0 THEN data
                ELSE json_build_object(
                  'MAIN_INCOME',
                  json_build_object('amount', da.income_total, 'coefficient', 'MONTHLY_NO_HOLIDAY_BONUS')
                )::jsonb
            END) AS data,
            da.effect,
            da.valid_from,
            da.valid_to,
            da.income_total
        FROM data_agg da
            JOIN ${getMigrationSchema()}evaka_person ep
                ON da.person_ssn = ep.effica_ssn
        `

    const incomeQuery = wrapWithReturning("evaka_income", incomeQueryPart, returnAll, ["person_ssn"])

    return await migrationDb.tx(async (t) => {
        await runQuery(incomeTableQuery, t)
        await runQuery(incomeFunctionQuery, t)
        return await runQuery(incomeQuery, t, true)
    })

}
// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { config } from "../config";
import migrationDb from "../db/db";
import { DEVIATION_TYPE_MAPPINGS } from "../mapping/citySpecific";
import {
    getExtensionSchemaPrefix,
    getMigrationSchemaPrefix,
    runQuery,
    selectFromTable,
} from "../util/queryTools";

export const transformFeeDeviationsData = async (
    returnAll: boolean = false
) => {
    const tableQuery = `
    DROP TABLE IF EXISTS ${getMigrationSchemaPrefix()}evaka_fee_alteration CASCADE;
    CREATE TABLE ${getMigrationSchemaPrefix()}evaka_fee_alteration(
        id UUID PRIMARY KEY DEFAULT ${getExtensionSchemaPrefix()}uuid_generate_v1mc(),
        person_id UUID REFERENCES ${getMigrationSchemaPrefix()}evaka_person,
        type TEXT,
        amount INTEGER NOT NULL,
        is_absolute BOOLEAN NOT NULL,
        valid_from DATE NOT NULL,
        valid_to DATE,
        notes TEXT,
        effica_placement_nbr INTEGER,
        effica_row_nbr INTEGER
    );`;

    const insertQuery = `
    INSERT INTO ${getMigrationSchemaPrefix()}evaka_fee_alteration
        (person_id, type, amount, is_absolute, valid_from, valid_to, notes, effica_placement_nbr, effica_row_nbr)
    SELECT
        ep.child_id,
        $(deviationTypes:json)::jsonb -> fd.deviationtype::text ->> 'type',
        CASE
            WHEN fd.sum = 0 THEN fd.procent
            ELSE fd.sum
        END,
        fd.sum != 0,
        fd.startdate,
        fd.enddate,
        $(deviationTypes:json)::jsonb -> fd.deviationtype::text ->> 'notes',
        fd.placementnbr,
        fd.rownbr
    FROM ${getMigrationSchemaPrefix()}feedeviations fd
    LEFT JOIN ${getMigrationSchemaPrefix()}evaka_placement ep ON ep.effica_placement_nbr = fd.placementnbr
    WHERE fd.deviationtype IS NOT NULL AND (fd.sum != 0 OR fd.procent != 0)
    `;

    const updateQueries = `
    DROP TABLE IF EXISTS ${getMigrationSchemaPrefix()}evaka_fee_alteration_todo;
    CREATE TABLE ${getMigrationSchemaPrefix()}evaka_fee_alteration_todo AS
    SELECT *, 'TODO' AS reason
    FROM ${getMigrationSchemaPrefix()}evaka_fee_alteration
    WHERE 1 = 2;

    INSERT INTO ${getMigrationSchemaPrefix()}evaka_fee_alteration_todo
    SELECT *, 'TYPE MISSING'
    FROM ${getMigrationSchemaPrefix()}evaka_fee_alteration
    WHERE type IS NULL;

    INSERT INTO ${getMigrationSchemaPrefix()}evaka_fee_alteration_todo
    SELECT *, 'PLACEMENT MISSING'
    FROM ${getMigrationSchemaPrefix()}evaka_fee_alteration
    WHERE person_id IS NULL;

    DELETE FROM ${getMigrationSchemaPrefix()}evaka_fee_alteration
    WHERE id IN (SELECT id FROM ${getMigrationSchemaPrefix()}evaka_fee_alteration_todo);
    `;

    return await migrationDb.tx(async (t) => {
        await runQuery(tableQuery, t);
        await runQuery(insertQuery, t, true, {
            deviationTypes: DEVIATION_TYPE_MAPPINGS[config.cityVariant],
        });
        await runQuery(updateQueries, t);
        return await runQuery(
            selectFromTable(
                "evaka_fee_alteration",
                config.migrationSchema,
                returnAll
            ),
            t,
            true
        );
    });
};

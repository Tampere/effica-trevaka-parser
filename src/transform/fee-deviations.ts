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
    wrapWithReturning,
} from "../util/queryTools";

export const transformFeeDeviationsData = async (
    returnAll: boolean = false
) => {
    const tableQuery = `
    DROP TABLE IF EXISTS ${getMigrationSchemaPrefix()}evaka_fee_alteration CASCADE;
    CREATE TABLE ${getMigrationSchemaPrefix()}evaka_fee_alteration(
        id UUID PRIMARY KEY DEFAULT ${getExtensionSchemaPrefix()}uuid_generate_v1mc(),
        person_id UUID NOT NULL REFERENCES ${getMigrationSchemaPrefix()}evaka_person,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        is_absolute BOOLEAN NOT NULL,
        valid_from DATE NOT NULL,
        valid_to DATE,
        notes TEXT NOT NULL
    );`;

    const insertQueryPart = `
    INSERT INTO ${getMigrationSchemaPrefix()}evaka_fee_alteration
        (person_id, type, amount, is_absolute, valid_from, valid_to, notes)
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
        $(deviationTypes:json)::jsonb -> fd.deviationtype::text ->> 'notes'
    FROM ${getMigrationSchemaPrefix()}feedeviations fd
    JOIN ${getMigrationSchemaPrefix()}evaka_placement ep ON ep.effica_placement_nbr = fd.placementnbr
    WHERE fd.deviationtype IS NOT NULL AND (fd.sum != 0 OR fd.procent != 0)
    `;

    const insertQuery = wrapWithReturning(
        "evaka_fee_alteration",
        insertQueryPart,
        returnAll
    );

    return await migrationDb.tx(async (t) => {
        await runQuery(tableQuery, t);
        return await runQuery(insertQuery, t, true, {
            deviationTypes: DEVIATION_TYPE_MAPPINGS[config.cityVariant],
        });
    });
};

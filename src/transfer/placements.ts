// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import migrationDb from "../db/db";
import {
    getMigrationSchemaPrefix,
    runQuery,
    wrapWithReturning,
} from "../util/queryTools";

export const transferPlacementsData = async (returnAll: boolean = false) => {
    return await migrationDb.tx(async (t) => {
        return {
            children: await transferChildData(t, returnAll),
            placements: await transferPlacementData(t, returnAll),
            serviceNeeds: await transferServiceNeedData(t, returnAll),
            daycareGroups: await transferDaycareGroupData(t, returnAll),
            groupPlacements: await transferGroupPlacementData(t, returnAll),
            cleanedDaycareGroups: await cleanupEmptyDaycareGroups(t, returnAll),
        };
    });
};

const transferChildData = async <T>(t: ITask<T>, returnAll: boolean) => {
    const insertQueryPart = `
    INSERT INTO child (id)
    SELECT DISTINCT child_id
    FROM ${getMigrationSchemaPrefix()}evaka_placement
    ON CONFLICT (id) DO NOTHING
    `;
    const insertQuery = wrapWithReturning("child", insertQueryPart, returnAll);

    return await runQuery(insertQuery, t, true);
};

const transferPlacementData = async <T>(t: ITask<T>, returnAll: boolean) => {
    const insertQueryPart = `
    INSERT INTO placement (id, type, child_id, unit_id, start_date, end_date)
    SELECT id, type::placement_type, child_id, unit_id, start_date, end_date
    FROM ${getMigrationSchemaPrefix()}evaka_placement
    `;
    const insertQuery = wrapWithReturning(
        "placement",
        insertQueryPart,
        returnAll
    );

    return await runQuery(insertQuery, t, true);
};

const transferServiceNeedData = async <T>(t: ITask<T>, returnAll: boolean) => {
    const insertQueryPart = `
    INSERT INTO service_need (id, option_id, placement_id, start_date, end_date, shift_care)
    SELECT id, option_id, placement_id, start_date, end_date, false
    FROM ${getMigrationSchemaPrefix()}evaka_service_need
    `;
    const insertQuery = wrapWithReturning(
        "service_need",
        insertQueryPart,
        returnAll
    );

    return await runQuery(insertQuery, t, true);
};

const transferDaycareGroupData = async <T>(t: ITask<T>, returnAll: boolean) => {
    const insertQueryPart = `
    INSERT INTO daycare_group (daycare_id, name, start_date, end_date)
    SELECT DISTINCT unit_id, 'Ryhmä', start_date, end_date
    FROM ${getMigrationSchemaPrefix()}evaka_placement
    WHERE daycare_group_id IS NULL
    `;
    const insertQuery = wrapWithReturning(
        "service_need",
        insertQueryPart,
        returnAll
    );

    return await runQuery(insertQuery, t, true);
};

const transferGroupPlacementData = async <T>(
    t: ITask<T>,
    returnAll: boolean
) => {
    const insertQueryPart = `
    INSERT INTO daycare_group_placement
        (daycare_placement_id, daycare_group_id, start_date, end_date)
    SELECT
        ep.id,
        coalesce(
            ep.daycare_group_id,
            (
                SELECT dg.id
                FROM daycare_group dg
                WHERE dg.daycare_id = ep.unit_id
                AND dg.start_date = ep.start_date
                AND dg.end_date = ep.end_date
            )
        ),
        ep.start_date,
        ep.end_date
    FROM ${getMigrationSchemaPrefix()}evaka_placement ep
    `;
    const insertQuery = wrapWithReturning(
        "service_need",
        insertQueryPart,
        returnAll
    );

    return await runQuery(insertQuery, t, true);
};

const cleanupEmptyDaycareGroups = async <T>(
    t: ITask<T>,
    returnAll: boolean
) => {
    const deleteQueryPart = `
    DELETE FROM daycare_group WHERE id NOT IN (SELECT daycare_group_id FROM daycare_group_placement)
    `;
    const deleteQuery = wrapWithReturning(
        "daycare_group",
        deleteQueryPart,
        returnAll
    );

    return await runQuery(deleteQuery, t, true);
};

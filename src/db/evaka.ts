// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import { extTableMapping } from "../mapping/sourceMapping";
import { TableDescriptor } from "../types";
import {
    getExtensionSchemaPrefix,
    getMigrationSchemaPrefix,
    truncateEvakaTables,
    wrapWithReturning
} from "../util/queryTools";
import migrationDb from "./db";
import { createDaycareTableQuery, createUnitManagerTableQuery } from "./tables";

export const affectedEvakaTablesList: string[] = [
    "absence",
    "application",
    "application_form",
    "assistance_action",
    "assistance_action_option_ref",
    "assistance_basis_option_ref",
    "assistance_need",
    "backup_care",
    "child",
    "child_attendance",
    "daycare",
    "daycare_caretaker",
    "daycare_group",
    "daycare_group_placement",
    "fee_alteration",
    "fee_decision",
    "fee_decision_child",
    "fridge_child",
    "fridge_partner",
    "income",
    "person",
    "placement",
    "service_need",
    "unit_manager",
    "varda_unit",
    "voucher_value_decision"
]


export const ensureEfficaUser = async <T>(t: ITask<T>): Promise<string> => {
    let user = await t.oneOrNone<{ id: string }>(
        "SELECT id FROM evaka_user WHERE type = 'UNKNOWN'::evaka_user_type AND name = 'Effica'",
        t
    );
    if (user === null) {
        user = await t.one<{ id: string }>(
            `
            INSERT INTO evaka_user (id, type, name)
            VALUES (${getExtensionSchemaPrefix()}uuid_generate_v1mc(), 'UNKNOWN'::evaka_user_type, 'Effica')
            RETURNING id`,
            t
        );
    }
    return user.id;
};

export const copyUnitManagersAndDaycaresFromEvaka = async (): Promise<any> => {
    const umTd = extTableMapping["evaka_unit_manager"]
    const daycareTd = extTableMapping["evaka_daycare"]
    const getCopyQuery = (td: TableDescriptor, sourceTableName: string) => `
        INSERT INTO ${getMigrationSchemaPrefix()}${td.tableName}
        SELECT * FROM ${sourceTableName}
        `

    return await migrationDb.task(async (t) => {

        await t.none(createUnitManagerTableQuery(umTd))
        await t.none(createDaycareTableQuery(daycareTd))

        const umResult = await t.any(wrapWithReturning("evaka_unit_manager", getCopyQuery(umTd, "unit_manager"), false))
        const daycareResult = await t.any(wrapWithReturning("evaka_daycare", getCopyQuery(daycareTd, "daycare"), false))
        return { unit_manager: umResult, daycare: daycareResult }
    })
}



//NOTE: This reset removes migrated data from evaka with the exception of daycare, daycare_acl and unit_manager tables
export const resetEvakaMigratedData = async () => {
    const evakaMigrationTables: string[] = [
        "person", "daycare_group", "varda_unit", "decision"
    ]
    return await migrationDb.tx(async (t) => {
        await truncateEvakaTables(evakaMigrationTables, t)
    })
}



export const vacuumAnalyzeEvaka = async () => {
    const results: Record<string, any> = {}
    for (let table of affectedEvakaTablesList) {
        try {
            let taskResult = await vacuumAnalyzeTable(table)
            results[table] = { command: taskResult.command, duration: taskResult.duration }
        } catch (err) {
            results[table] = err
        }
    }
    return results
}

export const vacuumAnalyzeTable = async (tableName: string) => {
    return await migrationDb.task(async (t) => {
        return t.result(
            `VACUUM (ANALYZE, VERBOSE) ${tableName};`
        )
    })
}
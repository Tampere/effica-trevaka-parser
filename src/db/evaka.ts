// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import { config } from "../config";
import { TableDescriptor } from "../types";
import {
    createGenericTableQueryFromDescriptor,
    getExtensionSchemaPrefix,
    getMigrationSchemaPrefix,
    truncateEvakaTables
} from "../util/queryTools";
import migrationDb from "./db";

export const affectedEvakaTablesList: string[] = [
    "absence",
    "application",
    "backup_care",
    "child",
    "child_attendance",
    "daycare",
    "daycare_group",
    "fee_decision",
    "fridge_child",
    "fridge_partner",
    "income",
    "person",
    "placement",
    "service_need",
    "unit_manager",
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

export const createUnitManagerTableQuery = (td: TableDescriptor): string => {
    return `
    create table if not exists ${getMigrationSchemaPrefix()}${td.tableName}
    (
        id uuid default ${getExtensionSchemaPrefix()}uuid_generate_v1mc() not null
            constraint unit_manager_pkey
                primary key,
        name text,
        phone text,
        email text
    )
    `
}

export const createDaycareTableQuery = (td: TableDescriptor): string => {
    return `
    create table if not exists ${getMigrationSchemaPrefix()}${td.tableName}
    (
        id uuid default ${getExtensionSchemaPrefix()}uuid_generate_v1mc() not null
            constraint daycare_pkey
                primary key,
        name text not null,
        type text[] default '{CENTRE}' not null,
        care_area_id uuid not null
            constraint fk$care_area
                references care_area
                    on delete cascade,
        phone text,
        url text,
        backup_location text,
        opening_date date,
        closing_date date,
        email text,
        schedule text,
        additional_info text,
        cost_center text,
        upload_to_varda boolean default false not null,
        decision_daycare_name text default ''::text not null,
        decision_preschool_name text default ''::text not null,
        street_address text default ''::text not null,
        postal_code text default ''::text not null,
        post_office text default ''::text not null,
        mailing_po_box text,
        location point,
        mailing_street_address text,
        mailing_postal_code text,
        mailing_post_office text,
        invoiced_by_municipality boolean default true not null,
        provider_type text default 'MUNICIPAL' not null,
        language text default 'fi' not null,
        upload_to_koski boolean default false not null,
        operation_days integer[] default '{1,2,3,4,5}'::integer[],
        ghost_unit boolean,
        daycare_apply_period daterange,
        preschool_apply_period daterange,
        club_apply_period daterange,
        round_the_clock boolean default false,
        unit_manager_id uuid
            constraint fk$unit_manager
                references ${getMigrationSchemaPrefix()}evaka_unit_manager(id),
        oph_unit_oid text
    );
    `
}

export const createAreaTableQuery = (td: TableDescriptor): string => {
    return `
    create table if not exists ${getMigrationSchemaPrefix()}${td.tableName}
    (
        id uuid default ${getExtensionSchemaPrefix()}uuid_generate_v1mc() not null
            constraint care_area_pkey
                primary key,
        name text not null
            constraint uniq$care_area_name
                unique,
        short_name text default ''::text not null
            constraint care_area_short_name_unique
                unique
    );
    `
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

export const createGenericFilteredViewQuery = (td: TableDescriptor) => {
    return td.uqKeys && td.uqKeys.length > 0 ? `
    CREATE OR REPLACE VIEW ${getMigrationSchemaPrefix()}filtered_${td.tableName}_v
    AS
    SELECT *
    FROM ${getMigrationSchemaPrefix()}${td.tableName} ${td.tableName}
    WHERE NOT EXISTS(
        SELECT 1
        FROM ${getMigrationSchemaPrefix()}${td.tableName}${config.exclusionSuffix} x
        WHERE ${td.uqKeys.map(k => `x.${k} = ${td.tableName}.${k}`).join(" AND ")}
    );
    ` : ""
}

export const createGenericExclusionTableQuery = (td: TableDescriptor) => {
    const exclusionCols = td.uqKeys && td.uqKeys.length > 0 ? Object.keys(td.columns).filter(k => td.uqKeys?.includes(k)) : Object.keys(td.columns)
    const excTableName = td.uqKeys && td.uqKeys.length > 0 ? `${td.tableName}${config.exclusionSuffix}` : td.tableName
    const primaryKeyStr = `, PRIMARY KEY (${exclusionCols?.join(",")})`
    return `CREATE TABLE IF NOT EXISTS 
        ${getMigrationSchemaPrefix()}
        ${excTableName}
        (${exclusionCols.map(c => `${c} ${td.columns[c].sqlType}`).join(",")}${primaryKeyStr});
        `
}

export const createGenericTableAndViewQueryFromDescriptor = (td: TableDescriptor) => {
    return `
    ${createGenericTableQueryFromDescriptor(td)}
    
    ${td.uqKeys && td.uqKeys.length > 0 ? createGenericExclusionTableQuery(td) : ""}

    ${createGenericFilteredViewQuery(td)}
    `
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
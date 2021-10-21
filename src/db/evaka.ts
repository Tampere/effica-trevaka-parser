// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import { TableDescriptor } from "../types";
import {
    getExtensionSchemaPrefix,
    getMigrationSchemaPrefix,
    truncateEvakaTable
} from "../util/queryTools";
import migrationDb from "./db";

export const ensureEfficaUser = async <T>(t: ITask<T>): Promise<string> => {
    let user = await t.oneOrNone<{ id: string }>(
        "SELECT id FROM employee WHERE first_name = 'Effica' AND last_name = 'Effica'",
        t
    );
    if (user === null) {
        user = await t.one<{ id: string }>(
            "INSERT INTO employee (first_name, last_name) VALUES ('Effica', 'Effica') RETURNING id",
            t
        );
    }
    return user.id;
};

export const createUnitManagerTableQuery = (td: TableDescriptor): string => {
    return `
    create table ${getMigrationSchemaPrefix()}${td.tableName}
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
    create table ${getMigrationSchemaPrefix()}${td.tableName}
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
                references ${getMigrationSchemaPrefix()}evaka_unit_manager(id)
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

export const resetEvakaMigratedData = async () => {
    const evakaMigrationTables: string[] = [
        "person", "daycare", "unit_manager"
    ]
    return await migrationDb.tx(async (t) => {
        for (let table of evakaMigrationTables) {
            await truncateEvakaTable(table, t)
        }
    })
}

import { ITask } from "pg-promise";
import { TableDescriptor } from "../types";
import { EvakaPerson } from "../types/evaka";
import { getExtensionSchemaPrefix, getMigrationSchemaPrefix } from "../util/queryTools";

export const findPersonBySSN = async <T>(t: ITask<T>, ssn: string) => {
    return await t.oneOrNone<EvakaPerson>(
        `
        SELECT *
        FROM person
        WHERE social_security_number = $(ssn)
        `,
        { ssn }
    );
};

export const findHeadOfChild = async <T>(
    t: ITask<T>,
    child: EvakaPerson,
    date: Date
) => {
    return await t.oneOrNone<EvakaPerson>(
        `
        SELECT p.*
        FROM person p
        JOIN fridge_child fc ON fc.head_of_child = p.id
        WHERE fc.child_id = $(childId)
        AND $(date) BETWEEN fc.start_date AND fc.end_date
        `,
        { childId: child.id, date }
    );
};


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
                references ${getMigrationSchemaPrefix()}evaka_areas
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
        round_the_clock boolean default false
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



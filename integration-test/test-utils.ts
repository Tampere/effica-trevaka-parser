// SPDX-FileCopyrightText: 2023-2024 Tampere region
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { pgp } from "../src/db/db";
import { importFilesFromDir } from "../src/io/io";
import { IDatabase, ITask } from "pg-promise";
import { IClient } from "pg-promise/typescript/pg-subset";
import { Config } from "../src/config";
import { transform } from "../src/transform";
import { transfer } from "../src/transfer";
import { baseQueryParameters } from "../src/util/queryTools";
import { CITY_SPECIFIC_MAPPINGS } from "../src/mapping/citySpecific";

export const AREA_COLUMN_SET = new pgp.helpers.ColumnSet(["id", "name"], {
    table: "care_area",
});

export const UNIT_COLUMN_SET = new pgp.helpers.ColumnSet(
    ["id", "name", "care_area_id", "provider_type"],
    {
        table: "daycare",
    },
);

export const imports = (
    db: IDatabase<{}, IClient>,
    ...options: { path: string; importTarget: string }[]
): Promise<any> =>
    db.tx((tx) =>
        Promise.all(
            options.map(({ path, importTarget }) =>
                importFilesFromDir(tx, {
                    path,
                    returnAll: false,
                    importTarget,
                }),
            ),
        ),
    );

export const transforms = (
    db: IDatabase<{}, IClient>,
    config: Config,
    ...args: string[]
) => db.tx((tx) => Promise.all(args.map((arg) => transform(tx, arg, config))));

export const transfers = (db: IDatabase<{}, IClient>, ...args: string[]) =>
    db.tx((tx) => Promise.all(args.map((arg) => transfer(tx, arg))));

export const findPlacementMappings = async (
    tx: ITask<{}>,
    cityVariant: string,
) => {
    const municipal = await tx.many(
        `
            SELECT mapping.key AS effica,
                   jsonb_build_object(
                           'id', service_need_option.id,
                           'name_fi', service_need_option.name_fi,
                           'valid_placement_type', service_need_option.valid_placement_type,
                           'default_option', service_need_option.default_option
                   )           AS evaka
            FROM jsonb_each($(placementMapping)) mapping
                     LEFT JOIN service_need_option ON service_need_option.id = (mapping.value ->> 'serviceNeedOptionId')::uuid
        `,
        CITY_SPECIFIC_MAPPINGS[cityVariant],
    );
    const voucher = await tx.many(
        `
            SELECT mapping.key AS effica,
                   jsonb_build_object(
                           'id', coalesce(voucher.id, municipal.id),
                           'name_fi', coalesce(voucher.name_fi, municipal.name_fi),
                           'valid_placement_type',
                           coalesce(voucher.valid_placement_type, municipal.valid_placement_type),
                           'default_option', coalesce(voucher.default_option, municipal.default_option)
                   )           AS evaka
            FROM jsonb_each($(placementMapping)) mapping
                     LEFT JOIN service_need_option voucher ON voucher.id =
                                                              (mapping.value ->> 'privateServiceVoucherServiceNeedOptionId')::uuid
                     LEFT JOIN service_need_option municipal ON municipal.id = (mapping.value ->> 'serviceNeedOptionId')::uuid
        `,
        CITY_SPECIFIC_MAPPINGS[cityVariant],
    );
    return { municipal, voucher };
};

export const findTransformPlacements = (tx: ITask<{}>) =>
    tx.manyOrNone(
        `
            SELECT effica_ssn,
                   placement_type,
                   placement_unit_id,
                   placement_start_date::text,
                   placement_end_date::text,
                   placement_place_guarantee,
                   service_need_option_id,
                   service_need_start_date::text,
                   service_need_end_date::text,
                   service_need_shift_care
            FROM $(migrationSchema:name).evaka_placement
            ORDER BY effica_ssn, placement_start_date, placement_type, service_need_start_date;
        `,
        { ...baseQueryParameters },
    );

export const findTransferPlacements = (tx: ITask<{}>) =>
    tx.manyOrNone(
        `
            SELECT person.social_security_number AS evaka_ssn,
                   placement.type                AS placement_type,
                   placement.unit_id             AS placement_unit,
                   placement.start_date::text    AS placement_start_date,
                   placement.end_date::text      AS placement_end_date,
                   placement.place_guarantee     AS placement_place_guarantee,
                   service_need.option_id        AS service_need_option_id,
                   service_need.start_date::text AS service_need_start_date,
                   service_need.end_date::text   AS service_need_end_date,
                   service_need.shift_care       AS service_need_shift_care
            FROM placement
                     JOIN person ON person.id = placement.child_id
                     LEFT JOIN service_need ON service_need.placement_id = placement.id
            ORDER BY evaka_ssn, placement_start_date, placement_type, service_need_start_date;
        `,
        { ...baseQueryParameters },
    );

export const findTransferIncomes = (tx: ITask<{}>) =>
    tx.manyOrNone(
        `
            SELECT person.social_security_number AS evaka_ssn,
                   data,
                   valid_from::text,
                   valid_to::text,
                   notes,
                   effect,
                   is_entrepreneur,
                   works_at_echa
            FROM income
                     JOIN person ON person.id = income.person_id
            ORDER BY evaka_ssn, valid_from
        `,
    );

export const findTransferFridge = (tx: ITask<{}>) =>
    tx.manyOrNone(
        `
            SELECT child.social_security_number         AS child_social_security_number,
                   head_of_child.social_security_number AS head_of_child_social_security_number,
                   fridge_child.start_date::text,
                   fridge_child.end_date::text
            FROM fridge_child
                     JOIN person child ON child.id = fridge_child.child_id
                     JOIN person head_of_child ON head_of_child.id = fridge_child.head_of_child
            ORDER BY child_social_security_number, head_of_child_social_security_number, start_date
        `,
    );

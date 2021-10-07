// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import { EfficaApplication, EfficaApplicationRow } from "../types/effica";
import { getMigrationSchemaPrefix } from "../util/queryTools";

export const findPersonBySSN = async <T>(t: ITask<T>, ssn: string) => {
    return await t.oneOrNone<any>(
        `
        SELECT *
        FROM ${getMigrationSchemaPrefix()}evaka_person
        WHERE effica_ssn = $(ssn)
        `,
        { ssn }
    );
};

export const findApplications = async <T>(t: ITask<T>) => {
    return await t.manyOrNone<EfficaApplication>(
        `
        SELECT *
        FROM ${getMigrationSchemaPrefix()}applications
        `
    );
};

export const findRowsByApplication = async <T>(
    t: ITask<T>,
    application: EfficaApplication
): Promise<EfficaApplicationRow[]> => {
    // TODO: implement
    return Promise.resolve([]);
    /*
    return await t.manyOrNone<EfficaApplicationRow>(
        `
        SELECT *
        FROM ${getMigrationSchema}applicationrows
        WHERE ???
        ORDER BY priority
        `
    );
    */
};

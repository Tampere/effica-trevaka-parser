// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import { config } from "../config";
import migrationDb from "../db/db";
import {
    APPLICATION_STATUS_MAPPINGS,
    APPLICATION_TYPE_MAPPINGS,
    CHILDMINDER_APPLICATION_UNIT
} from "../mapping/citySpecific";
import {
    baseQueryParameters,
    runQuery,
    runQueryFile,
    selectFromTable
} from "../util/queryTools";

export const transformApplicationData = async (returnAll: boolean = false) => {
    return migrationDb.tx(async (t) => {
        return {
            ...(await transformApplications(t, returnAll)),
        };
    });
};

const transformApplications = async <T>(t: ITask<T>, returnAll: boolean) => {
    await runQueryFile("transform-application.sql", t, {
        ...baseQueryParameters,
        typeMappings: APPLICATION_TYPE_MAPPINGS[config.cityVariant],
        allTypes: Object.keys(APPLICATION_TYPE_MAPPINGS[config.cityVariant]),
        statusMappings: APPLICATION_STATUS_MAPPINGS[config.cityVariant],
        childminderApplicationUnit: CHILDMINDER_APPLICATION_UNIT[config.cityVariant]
    });

    const applications = await runQuery(
        selectFromTable(
            "evaka_application",
            config.migrationSchema,
            returnAll,
            ["effica_id"]
        ),
        t,
        true
    );
    const applicationsTodo = await runQuery(
        selectFromTable(
            "evaka_application_todo",
            config.migrationSchema,
            returnAll,
            ["effica_id"]
        ),
        t,
        true
    );
    const applicationForms = await runQuery(
        selectFromTable(
            "evaka_application_form",
            config.migrationSchema,
            returnAll,
            ["effica_application_id", "effica_priority"]
        ),
        t,
        true
    );
    const applicationFormsTodo = await runQuery(
        selectFromTable(
            "evaka_application_form_todo",
            config.migrationSchema,
            returnAll,
            ["effica_application_id", "effica_priority"]
        ),
        t,
        true
    );

    return {
        applications,
        applicationsTodo,
        applicationForms,
        applicationFormsTodo,
    };
};

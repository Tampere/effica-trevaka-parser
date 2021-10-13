// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import { config } from "../config";
import migrationDb from "../db/db";
import { runQuery, runQueryFile, selectFromTable } from "../util/queryTools";

export const transferApplicationData = async (returnAll: boolean = false) => {
    return migrationDb.tx(async (t) => {
        return {
            ...(await transferApplications(t, returnAll)),
        };
    });
};

const queryParameters = {
    migrationSchema: config.migrationSchema,
    extensionSchema: config.extensionSchema,
};

const transferApplications = async <T>(t: ITask<T>, returnAll: boolean) => {
    await runQueryFile("transfer-application.sql", t, queryParameters);

    const applications = await runQuery(
        selectFromTable("application", "", returnAll, ["sentdate"]),
        t,
        true
    );
    const applicationForms = await runQuery(
        selectFromTable("application_form", "", returnAll, ["created"]),
        t,
        true
    );
    return { applications, applicationForms };
};

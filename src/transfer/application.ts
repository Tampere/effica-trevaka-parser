// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import migrationDb from "../db/db";
import {
    baseQueryParameters,
    runQuery,
    runQueryFile,
    selectFromTable,
} from "../util/queryTools";

export const transferApplicationData = async (returnAll: boolean = false) => {
    return migrationDb.tx(async (t) => {
        return {
            ...(await transferApplications(t, returnAll)),
        };
    });
};

const transferApplications = async <T>(t: ITask<T>, returnAll: boolean) => {
    await runQueryFile("transfer-application.sql", t, baseQueryParameters);

    const applications = await runQuery(
        selectFromTable("application", "", returnAll, ["sentdate DESC"]),
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

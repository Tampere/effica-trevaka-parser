// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { baseQueryParameters, runQueryFile } from "./util/queryTools";
import { ITask } from "pg-promise";

export const initDb = async (t: ITask<{}>) => {
    await runQueryFile("init.sql", t, baseQueryParameters);
    await runQueryFile("functions.sql", t, baseQueryParameters);
};

// SPDX-FileCopyrightText: 2023-2024 Tampere region
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ITask } from "pg-promise";
import { baseQueryParameters, runQueryFile } from "./util/queryTools";
import { ensureEfficaUser } from "./db/evaka";

export const transfer = async <T>(t: ITask<T>, type: string) => {
    const updatedAt = new Date()
    const updatedBy = await ensureEfficaUser(t);
    await runQueryFile(`transfer/${type}.sql`, t, {
        ...baseQueryParameters,
        updatedAt,
        updatedBy,
    });
};

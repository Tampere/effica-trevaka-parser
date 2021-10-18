// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import app from "./app";
import { config } from "./config";
import { initDb } from "./init";

Promise.all([initDb()])
    .then(() => {
        app.listen(config.port, () => {
            console.log(
                `Parser app listening at http://localhost:${config.port}`
            );
        });
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

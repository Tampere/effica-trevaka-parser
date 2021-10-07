// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import app from "./app"
import { config } from "./config"

app.listen(config.port, () => {
    console.log(`Parser app listening at http://localhost:${config.port}`)
})


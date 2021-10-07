// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { EfficaApplicationType } from "./types/effica";
import { EvakaApplicationType } from "./types/evaka";

export const APPLICATION_TYPE_MAP: Record<
    EfficaApplicationType,
    EvakaApplicationType
> = {
    BOA: "DAYCARE",
    BOK: "CLUB",
    PRO: "DAYCARE",
};

-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

CREATE TABLE IF NOT EXISTS ${migrationSchema:name}.idmap (
    type TEXT NOT NULL,
    effica_guid TEXT NOT NULL,
    evaka_id UUID NOT NULL,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (type, effica_guid)
);

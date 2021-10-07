-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

-- Add extensions here as needed (for UUIDs at least)
CREATE SCHEMA IF NOT EXISTS ext;
CREATE SCHEMA IF NOT EXISTS migration;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA ext;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA ext;
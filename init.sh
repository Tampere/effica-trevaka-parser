#!/bin/bash

# SPDX-FileCopyrightText: 2023-2024 Tampere region
#
# SPDX-License-Identifier: LGPL-2.1-or-later

set -e
set -u

function create_database() {
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE $1;
    \connect $1
    CREATE SCHEMA migration;
EOSQL
}

create_database vesilahti

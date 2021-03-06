// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

export type MigrationFunction = (returnAll: boolean) => Promise<any>;
export type MigrationOperation = { name: string, function: MigrationFunction }

export type FixScriptDescriptor = { filePath: string, parameters?: any }
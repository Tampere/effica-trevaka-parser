// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

export type FileDescriptor = { fileName: string, data: any, table: TableDescriptor, mapping: TypeMapping, importType: ImportType }
export type TableDescriptor =
    {
        tableName: string,
        columns: Record<string, ColumnDescriptor>,
        primaryKeys?: string[],
        //columns that define row uniqueness
        uqKeys?: string[],
        tableQueryFunction?: TableQueryFunction
    }
export type ColumnDescriptor = { sqlType: SqlType, parser: Function }

export type QueryOptions = {
    migrationSchema: string,
    extensionsSchema: string
}

export interface TableQueryFunction { (td: TableDescriptor): string }
export type TypeMapping = Record<string, TableDescriptor>
export type SqlType = "text" | "numeric" | "boolean" | "timestamptz" | "integer" | "date" | "text[]" | "uuid" | "point" | "integer[]" | "daterange"

export type ImportOptions = { returnAll: boolean, path: string }
export enum ImportType {
    Effica = "EFFICA",
    External = "EXT"
}

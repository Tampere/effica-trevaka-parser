export type FileDescriptor = { fileName: string, data: any, table: TableDescriptor }
export type TableDescriptor = { tableName: string, columns: ColumnDescriptor[] }
export type ColumnDescriptor = { columnName: string, sqlType: SqlType }

export interface TableMapping { [key: string]: SqlHelper }
export interface TypeMapping { [key: string]: TableMapping }
export type SqlHelper = { type: SqlType, parser: (value: any) => any }
export type SqlType = "text" | "numeric" | "boolean" | "timestamptz" | "integer" | "date"

export type ImportOptions = { returnAll: boolean, path: string }
// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import csv from "csvtojson/v2"
import * as xmlParser from "fast-xml-parser"
import { opendir, readFile } from "fs/promises"
import { config } from "../config"
import { efficaTableMapping, extTableMapping } from "../mapping/sourceMapping"
import { ColumnDescriptor, FileDescriptor, ImportOptions, ImportType, TableDescriptor, TypeMapping } from "../types"
import { errorCodes, ErrorWithCause } from "../util/error"
import { time, timeEnd } from "../util/timing"

export async function readFilesFromDir(importOptions: ImportOptions): Promise<FileDescriptor[]> {
    const files: FileDescriptor[] = []
    try {
        const dir = await opendir(importOptions.path)

        for await (const dirent of dir) {
            if (dirent.isFile()) {
                const fileName = dirent.name.toLowerCase()
                if (fileName.endsWith(".license")) continue
                time(`'${dirent.name}' reading`)
                const fileAsString = await readFile(`${importOptions.path}/${dirent.name}`, { encoding: "utf-8" })
                timeEnd(`'${dirent.name}' reading`)
                time(`'${dirent.name}' parsing`)

                const fileInfo = fileName.split(".")
                const fileType = fileInfo[1]
                //importTarget allows importing to a single table from multiple files
                const tableName = importOptions.importTarget ?? fileInfo[0]

                let file: FileDescriptor;
                if (fileType.toLowerCase() === "csv") {
                    const csvData = await csv(config.csvParserOptions).fromString(fileAsString)
                    file = {
                        fileName: fileName,
                        data: csvData,
                        table: collectTableDescription(tableName, csvData, extTableMapping),
                        mapping: extTableMapping,
                        importType: ImportType.External
                    }
                    // note that effica dumps are delivered as txt files
                } else {
                    const xmlData = xmlParser.parse(fileAsString, config.xmlParserOptions)
                    const tableData = stripXmlOverhead(xmlData, fileName)
                    file = {
                        fileName: fileName,
                        data: tableData,
                        table: collectTableDescription(tableName, tableData, efficaTableMapping),
                        mapping: efficaTableMapping,
                        importType: ImportType.Effica
                    }
                }
                timeEnd(`'${dirent.name}' parsing`)


                files.push(file)
            }
        }
    } catch (err) {
        throw new ErrorWithCause(`Parsing file data failed:`, err)
    }
    return files;
}

const stripXmlOverhead = (xmlData: any, fileName: string): any => {
    // { <item>: [Array] } 
    // the parsed XML data is just a wrapper object with the item key and an array of "item rows"

    if (typeof xmlData === "string") {
        throw new Error(`No parseable data element detected in '${fileName}' (${errorCodes.noDataContent})`)
    }
    const elementKeys = Object.keys(xmlData)
    const itemArray = xmlData[elementKeys[0]]
    if (elementKeys.length != 1) {
        throw new Error(`Table data ambiguous or insufficient:
            expected 1 element type, got ${elementKeys.length} [${elementKeys}] (${errorCodes.ambiguousTableData})`)
    }
    return itemArray

}

const collectTableDescription = (tableName: string, data: any, mapping: TypeMapping): TableDescriptor => {
    if (!Array.isArray(data)) {
        throw new Error(`Given table data was not an array, unable to form table description`)
    }
    const tableDef = mapping[tableName]
    if (!tableDef) {
        throw new Error(
            `Type definitions for table '${tableName}' not found (${errorCodes.nonMappedTable})`
        )
    }
    //check if table has a corresponding exclusion table
    const exclusionColumns = extTableMapping[`${tableName}${config.exclusionSuffix}`]?.columns

    //note that column descriptions are collected from data, not mapping
    //this enables import to take in files that only have a subset of the columns in the mapping
    return {
        tableName,
        columns: collectDataColumnDescriptions(tableName, tableDef, data[0]),
        primaryKeys: tableDef.primaryKeys,
        uqKeys: exclusionColumns ? Object.keys(exclusionColumns) : undefined,
        tableQueryFunction: tableDef.tableQueryFunction
    }
}

const collectDataColumnDescriptions = (tableName: string, td: TableDescriptor, dataItem: any) => {
    const dataDescription: Record<string, ColumnDescriptor> = {}
    Object.keys(dataItem).forEach(k => {
        const columnKey = k.toLowerCase()
        const columnDef = td.columns[columnKey]
        if (!columnDef) {
            throw new Error(`Type definition for column '${columnKey}' in table '${tableName}' not found (${errorCodes.nonMappedColumn})`)
        }
        dataDescription[columnKey] = columnDef
    })
    return dataDescription
}
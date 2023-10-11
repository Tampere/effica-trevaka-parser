// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import csv from "csvtojson/v2"
import * as xmlParser from "fast-xml-parser"
import { Dirent } from "fs"
import { opendir, readFile } from "fs/promises"
import LineReader from "n-readlines"
import pgPromise from "pg-promise"
import v8 from "v8"
import { config } from "../config"
import migrationDb from "../db/db"
import { importFileDataWithExistingTx } from "../import/service"
import { efficaTableMapping, extTableMapping } from "../mapping/sourceMapping"
import { ColumnDescriptor, FileDescriptor, ImportOptions, ImportType, PartitionImportOptions, TableDescriptor, TypeMapping } from "../types"
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
    return files.sort((a, b) => a.fileName.localeCompare(b.fileName));
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

export async function readFilesFromDirAsPartitions(importOptions: PartitionImportOptions): Promise<Record<string, any[]>> {
    const results: Record<string, any[]> = {}
    return await migrationDb.tx(async (t) => {
        try {
            const dir = await opendir(importOptions.path)

            for await (const dirent of dir) {
                if (dirent.isFile()) {
                    const fileName = dirent.name.toLowerCase()
                    if (fileName.endsWith(".license")) continue

                    if (fileName.split(".")[1] === 'csv') {
                        throw new Error("CSV partitioning not supported")
                    }
                    const importResult = await importFileInParts(importOptions, dirent, fileName, t)
                    results[fileName] = importResult
                }
            }
        } catch (err) {
            throw new ErrorWithCause(`Parsing file data failed:`, err)
        }
        return results
    })
}

async function importFileInParts(importOptions: PartitionImportOptions, dirent: Dirent, fileName: string, t: pgPromise.ITask<{}>) {
    const memUse: number[] = []
    let lines: string[] = []
    let line: Buffer | boolean
    let lineNumber = 0
    const maxBufferSize = importOptions.bufferSize

    if (!importOptions.importTarget) {
        throw new Error("Invalid import target defined")
    }
    const tableName = importOptions.importTarget
    const elementColumnCount = Object.keys(efficaTableMapping[tableName]?.columns).length
    if (!elementColumnCount) {
        throw new Error(`No column definitions found for ${tableName}`)
    }

    //used buffer size must be a multiple of the target element size
    const elementLineCount = elementColumnCount + 2
    const lineLimit = Math.floor(maxBufferSize / elementLineCount) * elementLineCount

    let results: any[] = []
    const fullpath = `${importOptions.path}/${dirent.name}`
    console.log(`Attempting to read at '${fullpath}'`)
    const lineReader = new LineReader(fullpath)
    let parts: number = 1

    const fileDesc = {
        fileName: fileName,
        table: efficaTableMapping[tableName],
        mapping: efficaTableMapping,
        importType: ImportType.Effica
    }

    let memUsage = 0
    //roll through the file using buffer
    while (line = lineReader.next()) {
        lines.push(line.toString())
        lineNumber++

        //parse, persist and clear buffer
        if (lineNumber === lineLimit) {

            memUsage = v8.getHeapStatistics().used_heap_size / 1024 / 1024
            memUse[parts - 1] = memUsage
            console.log(`Partition ${parts} for '${fileName}' into '${tableName}' | heapUse: ${memUsage.toPrecision(5)} MB | actual buffer size: ${lineLimit}`)
            let result = await importFileDataWithExistingTx([{
                ...fileDesc,
                fileName: `${fileName}_part${parts}`,
                data: processXmlPartition(lines, fileName)
            }],
                importOptions, t)
            results.push(result)
            lineNumber = 0
            lines = []
            parts++
        }
    }

    //check for overflow and persist
    if (lines.length > 0) {

        memUsage = v8.getHeapStatistics().used_heap_size / 1024 / 1024
        memUse[parts - 1] = memUsage
        let result = await importFileDataWithExistingTx([{
            ...fileDesc,
            fileName: parts === 1 ? fileName : `${fileName}_part${parts}`,
            data: processXmlPartition(lines, fileName)
        }],
            importOptions, t)

        results.push(result)
    }

    console.log(`Max buffer size: ${maxBufferSize} (${lineLimit} fitted) lines (${parts} partitions)`)
    console.log(
        {
            maxHeapUse: `${Math.max(...memUse).toPrecision(5)} MB`,
            avgHeapUse: `${(memUse.reduce((p, c) => p + c, 0) / memUse.length).toPrecision(5)} MB`
        })

    return results
}

const processXmlPartition = (parts: string[], fileName: string) => {
    const result = stripXmlOverhead(xmlParser.parse(parts.join("\n"), config.xmlParserOptions), fileName)
    return result
}


import { opendir, readFile } from "fs/promises";
import parser from "fast-xml-parser"
import { FileDescriptor, TableDescriptor, ColumnDescriptor } from "./types"
import { sqlTypeMapping } from "./mapping"
import { time, timeEnd } from "./timing"
import { config } from "./config";
import { ErrorWithCause, errorCodes } from "./util";

export async function readFilesFromDir(path: string): Promise<FileDescriptor[]> {
    const files: FileDescriptor[] = []
    try {
        const dir = await opendir(path)
        for await (const dirent of dir) {
            if (dirent.isFile()) {
                time(`'${dirent.name}' reading`)
                const xmlString = await readFile(`${path}/${dirent.name}`, { encoding: "utf-8" })
                timeEnd(`'${dirent.name}' reading`)
                time(`'${dirent.name}' parsing`)
                const xmlData = parser.parse(xmlString, config.xmlParserOptions)
                timeEnd(`'${dirent.name}' parsing`)
                const tableData = stripXmlOverhead(xmlData, dirent.name)
                const tableName = dirent.name.split('.')[0]
                const file: FileDescriptor = {
                    fileName: dirent.name,
                    data: tableData,
                    table: extractTableDescription(tableName, tableData)
                }
                files.push(file)
            }
        }
    } catch (err) {
        throw new ErrorWithCause(`Parsing XML data failed:`, err)
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

const extractTableDescription = (tableName: string, data: any): TableDescriptor => {
    if (!Array.isArray(data)) {
        throw new Error(`Given table data was not an array, unable to form table description`)
    }
    const tableDef = sqlTypeMapping[tableName]
    if (!tableDef) {
        throw new Error(
            `Type definitions for table '${tableName}' not found (${errorCodes.nonMappedTable})`
        )
    }
    const columns: ColumnDescriptor[] = Object.keys(data[0]).map(k => {
        const columnDef = tableDef[k]
        if (!columnDef) {
            throw new Error(`Type definition for column '${k}' in table '${tableName}' not found (${errorCodes.nonMappedColumn})`)
        }
        return {
            columnName: k,
            sqlType: tableDef[k].type
        }
    })
    return { tableName: tableName, columns }
}

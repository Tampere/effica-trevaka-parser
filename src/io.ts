
import { opendir, readFile } from "fs/promises";
import parser from "fast-xml-parser"
import { FileDescriptor, TableDescriptor, ColumnDescriptor } from "./types"
import { sqlTypeMapping } from "./mapping"
import {time, timeEnd} from "./timing"

export async function readFilesFromDir(path: string): Promise<FileDescriptor[]> {
    const files: FileDescriptor[] = []
    try {
        const dir = await opendir(path);
        for await (const dirent of dir) {
            if (dirent.isFile()) {
                time(`'${dirent.name}' reading`)
                const xmlString = await readFile(`${path}/${dirent.name}`, { encoding: "utf-8" })
                timeEnd(`'${dirent.name}' reading`)
                time(`'${dirent.name}' parsing`)
                const xmlData = parser.parse(xmlString)
                timeEnd(`'${dirent.name}' parsing`)
                const tableData = stripXmlOverhead(xmlData)
                const tableName = dirent.name.split('.')[0]
                const file: FileDescriptor = { fileName: dirent.name, data: tableData, table: extractTableDescription(tableName, tableData) }
                files.push(file)
            }
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
    return files;
}

const stripXmlOverhead = (xmlData: any): any => {
    const root = xmlData[Object.keys(xmlData)[0]]
    return root[Object.keys(root)[0]]
}

const extractTableDescription = (tableName: string, data: any): TableDescriptor => {
    const columns: ColumnDescriptor[] = Object.keys(data[0]).map(k => { return { columnName: k, sqlType: sqlTypeMapping[tableName][k].type } })
    return { tableName: tableName, columns }

}
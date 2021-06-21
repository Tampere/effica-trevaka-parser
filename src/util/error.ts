
interface Cause { stack: string }
export class ErrorWithCause extends Error {
    constructor(message: string, error: Cause) {
        super(message)
        const lineCount = (this.message.match(/\n/g) ?? []).length + 1
        this.stack = `${this.stack?.split('\n').slice(0, lineCount + 1).join('\n') ?? ""}
        ${error.stack}`
    }
}

export const errorCodes = {
    nonFlatData: "E-TREP-10001",
    nonMappedTable: "E-TREP-10002",
    nonMappedColumn: "E-TREP-10003",
    noDataContent: "E-TREP-10004",
    ambiguousTableData: "E-TREP-10005"
}
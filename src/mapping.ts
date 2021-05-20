import { activityParser, booleanParser, codeNumericParser, dateParser, nullForcingTextParser, numericBooleanParser } from "./parsers"
import { TypeMapping } from "./types"


// dateformat in effica-data: yyyymmdd
// booleans encoded as 0/1 (apart from code activity)
// missing coded value seems to be 0, never null

//TODO: add rest of tables
export const sqlTypeMapping: TypeMapping = {
    codes: {
        code: { type: "integer", parser: codeNumericParser },
        active: { type: "boolean", parser: activityParser },
        codetype: { type: "text", parser: nullForcingTextParser },
        text: { type: "text", parser: nullForcingTextParser },
        extrainfo1: { type: "text", parser: nullForcingTextParser },
        extrainfo2: { type: "text", parser: nullForcingTextParser },
        guid: { type: "text", parser: nullForcingTextParser },
    },
    families: {
        familynbr: { type: "integer", parser: nullForcingTextParser },
        personid: { type: "text", parser: nullForcingTextParser },
        startdate: { type: "date", parser: dateParser },
        enddate: { type: "date", parser: dateParser },
        roleinfamily: { type: "text", parser: nullForcingTextParser },
        guid: { type: "text", parser: nullForcingTextParser }
    },
    income: {
        personid: { type: "text", parser: nullForcingTextParser },
        startdate: { type: "date", parser: dateParser },
        enddate: { type: "date", parser: dateParser },
        maxincome: { type: "boolean", parser: numericBooleanParser },
        incomemissing: { type: "boolean", parser: numericBooleanParser },
        summa: { type: "numeric", parser: nullForcingTextParser },
        guid: { type: "text", parser: nullForcingTextParser }
    },
    incomerows: {
        personid: { type: "text", parser: nullForcingTextParser },
        startdate: { type: "date", parser: dateParser },
        enddate: { type: "date", parser: dateParser },
        incomeperiod: { type: "integer", parser: nullForcingTextParser },
        incometype: { type: "integer", parser: nullForcingTextParser },
        summa: { type: "numeric", parser: nullForcingTextParser },
        guid: { type: "text", parser: nullForcingTextParser }
    },
    person: {
        personid: { type: "text", parser: nullForcingTextParser },
        personname: { type: "text", parser: nullForcingTextParser },
        secretaddress: { type: "boolean", parser: numericBooleanParser },
        personstreetaddress: { type: "text", parser: nullForcingTextParser },
        personcity: { type: "text", parser: nullForcingTextParser },
        personzipcode: { type: "text", parser: nullForcingTextParser },
        personhomeemail: { type: "text", parser: nullForcingTextParser },
        personmobilephone: { type: "text", parser: nullForcingTextParser },
        mothertongue: { type: "integer", parser: codeNumericParser },
        nationality: { type: "integer", parser: codeNumericParser },
        homemunicipality: { type: "integer", parser: codeNumericParser },
        guid: { type: "text", parser: nullForcingTextParser }
    }
}
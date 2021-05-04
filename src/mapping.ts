import { activityParser, booleanParser, dateParser, textParser } from "./parsers"
import { TypeMapping } from "./types"

//TODO: add rest of tables
export const sqlTypeMapping: TypeMapping = {
    codes: {
        code: { type: "text", parser: textParser },
        active: { type: "boolean", parser: activityParser },
        codetype: { type: "text", parser: textParser },
        text: { type: "text", parser: textParser },
        extrainfo1: { type: "text", parser: textParser },
        extrainfo2: { type: "text", parser: textParser }
    },
    families: {
        familynbr: { type: "integer", parser: textParser },
        personid: { type: "text", parser: textParser },
        startdate: { type: "date", parser: dateParser },
        enddate: { type: "date", parser: dateParser },
        roleinfamily: { type: "text", parser: textParser },
    },
    income: {
        personid: { type: "text", parser: textParser },
        startdate: { type: "date", parser: dateParser },
        enddate: { type: "date", parser: dateParser },
        maxincome: { type: "boolean", parser: booleanParser },
        incomemissing: { type: "boolean", parser: booleanParser },
        summa: { type: "numeric", parser: textParser },
    },
    incomerows: {
        personid: { type: "text", parser: textParser },
        startdate: { type: "date", parser: dateParser },
        enddate: { type: "date", parser: dateParser },
        incomeperiod: { type: "integer", parser: textParser },
        incometype: { type: "integer", parser: textParser },
        summa: { type: "numeric", parser: textParser },
    },
    persons: {
        personid: { type: "text", parser: textParser },
        personname: { type: "text", parser: textParser },
        secretaddress: { type: "boolean", parser: booleanParser },
        personstreetaddress: { type: "text", parser: textParser },
        personcity: { type: "text", parser: textParser },
        personzipcode: { type: "text", parser: textParser },
        personhomeemail: { type: "text", parser: textParser },
        personmobilephone: { type: "text", parser: textParser },
        mothertongue: { type: "integer", parser: textParser },
        nationality: { type: "integer", parser: textParser },
        homemunicipality: { type: "integer", parser: textParser }
    }
}
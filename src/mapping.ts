import { activityParser, booleanParser, dateParser, nullForcingTextParser } from "./parsers"
import { TypeMapping } from "./types"

//TODO: add rest of tables
export const sqlTypeMapping: TypeMapping = {
    codes: {
        code: { type: "text", parser: nullForcingTextParser },
        active: { type: "boolean", parser: activityParser },
        codetype: { type: "text", parser: nullForcingTextParser },
        text: { type: "text", parser: nullForcingTextParser },
        extrainfo1: { type: "text", parser: nullForcingTextParser },
        extrainfo2: { type: "text", parser: nullForcingTextParser }
    },
    families: {
        familynbr: { type: "integer", parser: nullForcingTextParser },
        personid: { type: "text", parser: nullForcingTextParser },
        startdate: { type: "date", parser: dateParser },
        enddate: { type: "date", parser: dateParser },
        roleinfamily: { type: "text", parser: nullForcingTextParser },
    },
    income: {
        personid: { type: "text", parser: nullForcingTextParser },
        startdate: { type: "date", parser: dateParser },
        enddate: { type: "date", parser: dateParser },
        maxincome: { type: "boolean", parser: booleanParser },
        incomemissing: { type: "boolean", parser: booleanParser },
        summa: { type: "numeric", parser: nullForcingTextParser },
    },
    incomerows: {
        personid: { type: "text", parser: nullForcingTextParser },
        startdate: { type: "date", parser: dateParser },
        enddate: { type: "date", parser: dateParser },
        incomeperiod: { type: "integer", parser: nullForcingTextParser },
        incometype: { type: "integer", parser: nullForcingTextParser },
        summa: { type: "numeric", parser: nullForcingTextParser },
    },
    persons: {
        personid: { type: "text", parser: nullForcingTextParser },
        personname: { type: "text", parser: nullForcingTextParser },
        secretaddress: { type: "boolean", parser: booleanParser },
        personstreetaddress: { type: "text", parser: nullForcingTextParser },
        personcity: { type: "text", parser: nullForcingTextParser },
        personzipcode: { type: "text", parser: nullForcingTextParser },
        personhomeemail: { type: "text", parser: nullForcingTextParser },
        personmobilephone: { type: "text", parser: nullForcingTextParser },
        mothertongue: { type: "integer", parser: nullForcingTextParser },
        nationality: { type: "integer", parser: nullForcingTextParser },
        homemunicipality: { type: "integer", parser: nullForcingTextParser }
    }
}
import { activityParser, codeNumericParser, dateParser, nullForcingTextParser, numericBooleanParser } from "./parsers"
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
    },
    areas: {
        areacode: { type: "integer", parser: nullForcingTextParser },
        areaname: { type: "text", parser: nullForcingTextParser },
        level: { type: "integer", parser: nullForcingTextParser },
        parent: { type: "integer", parser: nullForcingTextParser },
        guid: { type: "text", parser: nullForcingTextParser }
    },
    units: {
        unitcode: { type: "integer", parser: codeNumericParser },
        unitname: { type: "text", parser: nullForcingTextParser },
        startdate: { type: "date", parser: dateParser },
        enddate: { type: "date", parser: dateParser },
        unitaddress: { type: "text", parser: nullForcingTextParser },
        unitzipcode: { type: "text", parser: nullForcingTextParser },
        unitcity: { type: "text", parser: nullForcingTextParser },
        unitemail: { type: "text", parser: nullForcingTextParser },
        phone1: { type: "text", parser: nullForcingTextParser },
        unit24_7: { type: "boolean", parser: numericBooleanParser },
        areacode: { type: "integer", parser: nullForcingTextParser },
        guid: { type: "text", parser: nullForcingTextParser }
    },
    departments: {
        unitcode: { type: "integer", parser: codeNumericParser },
        departmentcode: { type: "integer", parser: codeNumericParser },
        departmentname: { type: "text", parser: nullForcingTextParser },
        startdate: { type: "date", parser: dateParser },
        enddate: { type: "date", parser: dateParser },
        departmentaddress: { type: "text", parser: nullForcingTextParser },
        departmentzipcode: { type: "text", parser: nullForcingTextParser },
        departmentcity: { type: "text", parser: nullForcingTextParser },
        departmentemail: { type: "text", parser: nullForcingTextParser },
        phone: { type: "text", parser: nullForcingTextParser },
        guid: { type: "text", parser: nullForcingTextParser }
    },
    placements: {
        placementnbr: { type: "integer", parser: nullForcingTextParser },
        personid: { type: "text", parser: nullForcingTextParser },
        placementunitcode: { type: "integer", parser: codeNumericParser },
        placementdepartmentcode: { type: "integer", parser: codeNumericParser },
        placementchildminder: { type: "text", parser: nullForcingTextParser },
        startdate: { type: "date", parser: dateParser },
        enddate: { type: "date", parser: dateParser },
        guid: { type: "text", parser: nullForcingTextParser }
    },
    placementextents: {
        placementnbr: { type: "integer", parser: codeNumericParser },
        extentnbr: { type: "integer", parser: codeNumericParser },
        startdate: { type: "date", parser: dateParser },
        enddate: { type: "date", parser: dateParser },
        hours: { type: "numeric", parser: nullForcingTextParser },
        days: { type: "integer", parser: nullForcingTextParser },
        extentcode: { type: "text", parser: nullForcingTextParser },
        guid: { type: "text", parser: nullForcingTextParser }
    },
    feedeviations: {
        placementnbr: { type: "integer", parser: codeNumericParser },
        rownbr: { type: "integer", parser: codeNumericParser },
        serviceform: { type: "integer", parser: codeNumericParser },
        deviationtype: { type: "integer", parser: codeNumericParser },
        startdate: { type: "date", parser: dateParser },
        enddate: { type: "date", parser: dateParser },
        sum: { type: "numeric", parser: nullForcingTextParser },
        procent: { type: "numeric", parser: nullForcingTextParser },
        hours: { type: "numeric", parser: nullForcingTextParser },
        days: { type: "integer", parser: nullForcingTextParser },
        extentcode: { type: "integer", parser: codeNumericParser },
        guid: { type: "text", parser: nullForcingTextParser }
    }
}

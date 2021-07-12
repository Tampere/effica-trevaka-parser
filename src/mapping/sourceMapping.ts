import { activityParser, codeNumericParser, csvStringBooleanParser, nonNullDateParser, nullDateParser, nullForcingTextParser, numericBooleanParser, stringToNumericParser } from "../parsers"
import { TypeMapping } from "../types"


// dateformat in effica-data: yyyymmdd
// booleans encoded as 0/1 (apart from code activity)
// missing coded value seems to be 0, never null

//TODO: add rest of tables
export const efficaTableMapping: TypeMapping = {
    applications: {
        personid: { type: "text", parser: nullForcingTextParser },
        applicationdate: { type: "date", parser: nullDateParser },
        placeneed: { type: "numeric", parser: nullForcingTextParser },
        specialhandlingtime: { type: "numeric", parser: nullForcingTextParser },
        transferapplication: { type: "boolean", parser: numericBooleanParser },
        guid: { type: "text", parser: nullForcingTextParser },
    },
    applicationrows: {
        personid: { type: "text", parser: nullForcingTextParser },
        priority: { type: "integer", parser: nullForcingTextParser },
        unitcode: { type: "integer", parser: nullForcingTextParser },
        childminder: { type: "text", parser: nullForcingTextParser },
        areacode: { type: "text", parser: nullForcingTextParser },
        startdate: { type: "date", parser: nullDateParser },
        hours: { type: "numeric", parser: nullForcingTextParser },
        childmindercare: { type: "text", parser: nullForcingTextParser },
        unitcare: { type: "integer", parser: nullForcingTextParser },
        days: { type: "integer", parser: nullForcingTextParser },
        extent: { type: "integer", parser: nullForcingTextParser },
        type: { type: "text", parser: nullForcingTextParser },
        guid: { type: "text", parser: nullForcingTextParser },
    },
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
        startdate: { type: "date", parser: nonNullDateParser },
        enddate: { type: "date", parser: nonNullDateParser },
        roleinfamily: { type: "text", parser: nullForcingTextParser },
        guid: { type: "text", parser: nullForcingTextParser }
    },
    income: {
        personid: { type: "text", parser: nullForcingTextParser },
        startdate: { type: "date", parser: nullDateParser },
        enddate: { type: "date", parser: nullDateParser },
        maxincome: { type: "boolean", parser: numericBooleanParser },
        incomemissing: { type: "boolean", parser: numericBooleanParser },
        summa: { type: "numeric", parser: nullForcingTextParser },
        guid: { type: "text", parser: nullForcingTextParser }
    },
    incomerows: {
        personid: { type: "text", parser: nullForcingTextParser },
        startdate: { type: "date", parser: nullDateParser },
        enddate: { type: "date", parser: nullDateParser },
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
        startdate: { type: "date", parser: nonNullDateParser },
        enddate: { type: "date", parser: nonNullDateParser },
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
        startdate: { type: "date", parser: nonNullDateParser },
        enddate: { type: "date", parser: nonNullDateParser },
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
        startdate: { type: "date", parser: nullDateParser },
        enddate: { type: "date", parser: nullDateParser },
        guid: { type: "text", parser: nullForcingTextParser }
    },
    placementextents: {
        placementnbr: { type: "integer", parser: codeNumericParser },
        extentnbr: { type: "integer", parser: codeNumericParser },
        startdate: { type: "date", parser: nullDateParser },
        enddate: { type: "date", parser: nullDateParser },
        hours: { type: "numeric", parser: nullForcingTextParser },
        days: { type: "integer", parser: nullForcingTextParser },
        extentcode: { type: "integer", parser: codeNumericParser },
        guid: { type: "text", parser: nullForcingTextParser }
    },
    feedeviations: {
        placementnbr: { type: "integer", parser: codeNumericParser },
        rownbr: { type: "integer", parser: codeNumericParser },
        serviceform: { type: "integer", parser: codeNumericParser },
        deviationtype: { type: "integer", parser: codeNumericParser },
        startdate: { type: "date", parser: nullDateParser },
        enddate: { type: "date", parser: nullDateParser },
        sum: { type: "numeric", parser: nullForcingTextParser },
        procent: { type: "numeric", parser: nullForcingTextParser },
        hours: { type: "numeric", parser: nullForcingTextParser },
        days: { type: "integer", parser: nullForcingTextParser },
        extentcode: { type: "integer", parser: codeNumericParser },
        guid: { type: "text", parser: nullForcingTextParser }
    },
    decisions: {
        personid: { type: "text", parser: nullForcingTextParser },
        decisiontype: { type: "integer", parser: codeNumericParser },
        decisionstatus: { type: "integer", parser: codeNumericParser },
        decisionunitcode: { type: "integer", parser: codeNumericParser },
        decisionchildminder: { type: "text", parser: nullForcingTextParser },
        startdate: { type: "date", parser: nullDateParser },
        enddate: { type: "date", parser: nullDateParser },
        decisiondate: { type: "date", parser: nullDateParser },
        caseworker: { type: "text", parser: nullForcingTextParser },
        decisionmaker: { type: "text", parser: nullForcingTextParser },
        decisionnbr: { type: "integer", parser: nullForcingTextParser },
        extent: { type: "integer", parser: codeNumericParser },
        days: { type: "integer", parser: nullForcingTextParser },
        paydecision: { type: "numeric", parser: nullForcingTextParser },
        sum: { type: "numeric", parser: nullForcingTextParser },
        totalsum: { type: "numeric", parser: nullForcingTextParser },
        grandtotal: { type: "numeric", parser: nullForcingTextParser },
        guid: { type: "text", parser: nullForcingTextParser }
    },
    childminders: {
        personid: { type: "text", parser: nullForcingTextParser },
        area: { type: "integer", parser: codeNumericParser },
        startdate: { type: "date", parser: nullDateParser },
        enddate: { type: "date", parser: nullDateParser },
        phonenbr: { type: "text", parser: nullForcingTextParser },
        email: { type: "text", parser: nullForcingTextParser },
        guid: { type: "text", parser: nullForcingTextParser }
    }
}

export const extTableMapping: TypeMapping = {
    evaka_areas: {
        id: { type: "uuid", parser: nullForcingTextParser },
        name: { type: "text", parser: nullForcingTextParser },
        short_name: { type: "text", parser: nullForcingTextParser }
    },
    unitmap: {
        effica_id: { type: "integer", parser: stringToNumericParser },
        evaka_id: { type: "uuid", parser: nullForcingTextParser }
    },
    evaka_daycare: {
        id: { type: "uuid", parser: nullForcingTextParser },
        name: { type: "text", parser: nullForcingTextParser },
        type: { type: "text[]", parser: nullForcingTextParser },
        care_area_id: { type: "uuid", parser: nullForcingTextParser },
        phone: { type: "text", parser: nullForcingTextParser },
        url: { type: "text", parser: nullForcingTextParser },
        backup_location: { type: "text", parser: nullForcingTextParser },
        opening_date: { type: "date", parser: nullDateParser },
        closing_date: { type: "date", parser: nullDateParser },
        email: { type: "text", parser: nullForcingTextParser },
        schedule: { type: "text", parser: nullForcingTextParser },
        additional_info: { type: "text", parser: nullForcingTextParser },
        cost_center: { type: "text", parser: nullForcingTextParser },
        upload_to_varda: { type: "boolean", parser: csvStringBooleanParser },
        decision_daycare_name: { type: "text", parser: nullForcingTextParser },
        decision_preschool_name: { type: "text", parser: nullForcingTextParser },
        street_address: { type: "text", parser: nullForcingTextParser },
        postal_code: { type: "text", parser: nullForcingTextParser },
        post_office: { type: "text", parser: nullForcingTextParser },
        mailing_po_box: { type: "text", parser: nullForcingTextParser },
        location: { type: "point", parser: nullForcingTextParser },
        mailing_street_address: { type: "text", parser: nullForcingTextParser },
        mailing_postal_code: { type: "text", parser: nullForcingTextParser },
        mailing_post_office: { type: "text", parser: nullForcingTextParser },
        invoiced_by_municipality: { type: "boolean", parser: csvStringBooleanParser },
        provider_type: { type: "text", parser: nullForcingTextParser },
        language: { type: "text", parser: nullForcingTextParser },
        upload_to_koski: { type: "boolean", parser: csvStringBooleanParser },
        operation_days: { type: "integer[]", parser: nullForcingTextParser },
        ghost_unit: { type: "boolean", parser: csvStringBooleanParser },
        daycare_apply_period: { type: "daterange", parser: nullForcingTextParser },
        preschool_apply_period: { type: "daterange", parser: nullForcingTextParser },
        round_the_clock: { type: "boolean", parser: csvStringBooleanParser },
    }
}
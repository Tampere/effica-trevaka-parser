// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { createAreaTableQuery, createDaycareTableQuery, createUnitManagerTableQuery } from "../db/evaka"
import { activityParser, codeNumericParser, csvStringArrayParser, csvStringBooleanParser, nonNullDateParser, nonNullTextParser, nullDateParser, nullForcingTextParser, numericBooleanParser, stringToNumericParser } from "../parsers"
import { TypeMapping } from "../types"

// dateformat in effica-data: yyyymmdd
// booleans encoded as 0/1 (apart from code activity)
// missing coded value seems to be 0, never null

//TODO: add rest of tables
export const efficaTableMapping: TypeMapping = {
    applications: {
        tableName: "applications",
        columns: {
            personid: { sqlType: "text", parser: nullForcingTextParser },
            applicationdate: { sqlType: "date", parser: nullDateParser },
            placeneed: { sqlType: "numeric", parser: nullForcingTextParser },
            specialhandlingtime: { sqlType: "numeric", parser: nullForcingTextParser },
            transferapplication: { sqlType: "boolean", parser: numericBooleanParser },
            status: { sqlType: "integer", parser: nullForcingTextParser },
            careid: { sqlType: "integer", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser }
        },
        primaryKeys: ["guid"],
    },
    applicationrows: {
        tableName: "applicationrows",
        columns: {
            personid: { sqlType: "text", parser: nullForcingTextParser },
            priority: { sqlType: "integer", parser: nullForcingTextParser },
            unitcode: { sqlType: "integer", parser: nullForcingTextParser },
            childminder: { sqlType: "text", parser: nullForcingTextParser },
            areacode: { sqlType: "text", parser: nullForcingTextParser },
            startdate: { sqlType: "date", parser: nullDateParser },
            hours: { sqlType: "numeric", parser: nullForcingTextParser },
            childmindercare: { sqlType: "text", parser: nullForcingTextParser },
            unitcare: { sqlType: "integer", parser: nullForcingTextParser },
            days: { sqlType: "integer", parser: nullForcingTextParser },
            extent: { sqlType: "integer", parser: nullForcingTextParser },
            type: { sqlType: "text", parser: nullForcingTextParser },
            careid: { sqlType: "integer", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser }
        }
    },
    codes: {
        tableName: "codes",
        columns: {
            code: { sqlType: "integer", parser: codeNumericParser },
            active: { sqlType: "boolean", parser: activityParser },
            codetype: { sqlType: "text", parser: nullForcingTextParser },
            text: { sqlType: "text", parser: nullForcingTextParser },
            extrainfo1: { sqlType: "text", parser: nullForcingTextParser },
            extrainfo2: { sqlType: "text", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser },
        }
    },
    families: {
        tableName: "families",
        columns: {
            familynbr: { sqlType: "integer", parser: nullForcingTextParser },
            personid: { sqlType: "text", parser: nullForcingTextParser },
            startdate: { sqlType: "date", parser: nonNullDateParser },
            enddate: { sqlType: "date", parser: nullDateParser },
            roleinfamily: { sqlType: "text", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser }
        }
    },
    income: {
        tableName: "income",
        columns: {
            personid: { sqlType: "text", parser: nullForcingTextParser },
            startdate: { sqlType: "date", parser: nullDateParser },
            enddate: { sqlType: "date", parser: nullDateParser },
            maxincome: { sqlType: "boolean", parser: numericBooleanParser },
            incomemissing: { sqlType: "boolean", parser: numericBooleanParser },
            summa: { sqlType: "numeric", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser }
        }
    },
    incomerows: {
        tableName: "incomerows",
        columns: {
            personid: { sqlType: "text", parser: nullForcingTextParser },
            startdate: { sqlType: "date", parser: nullDateParser },
            enddate: { sqlType: "date", parser: nullDateParser },
            incomeperiod: { sqlType: "integer", parser: nullForcingTextParser },
            incometype: { sqlType: "integer", parser: nullForcingTextParser },
            summa: { sqlType: "numeric", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser }
        }
    },
    person: {
        tableName: "person",
        columns: {
            personid: { sqlType: "text", parser: nullForcingTextParser },
            personname: { sqlType: "text", parser: nullForcingTextParser },
            secretaddress: { sqlType: "boolean", parser: numericBooleanParser },
            personstreetaddress: { sqlType: "text", parser: nullForcingTextParser },
            personcity: { sqlType: "text", parser: nullForcingTextParser },
            personzipcode: { sqlType: "text", parser: nullForcingTextParser },
            personhomeemail: { sqlType: "text", parser: nullForcingTextParser },
            personmobilephone: { sqlType: "text", parser: nullForcingTextParser },
            phonehome: { sqlType: "text", parser: nullForcingTextParser },
            phonework: { sqlType: "text", parser: nullForcingTextParser },
            mothertongue: { sqlType: "integer", parser: codeNumericParser },
            nationality: { sqlType: "integer", parser: codeNumericParser },
            homemunicipality: { sqlType: "integer", parser: codeNumericParser },
            guid: { sqlType: "text", parser: nullForcingTextParser }
        },
        primaryKeys: ["guid"],
    },
    areas: {
        tableName: "areas",
        columns: {
            areacode: { sqlType: "integer", parser: nullForcingTextParser },
            areaname: { sqlType: "text", parser: nullForcingTextParser },
            level: { sqlType: "integer", parser: nullForcingTextParser },
            parent: { sqlType: "integer", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser }
        }
    },
    units: {
        tableName: "units",
        columns: {
            unitcode: { sqlType: "integer", parser: codeNumericParser },
            unitname: { sqlType: "text", parser: nullForcingTextParser },
            startdate: { sqlType: "date", parser: nonNullDateParser },
            enddate: { sqlType: "date", parser: nonNullDateParser },
            unitaddress: { sqlType: "text", parser: nullForcingTextParser },
            unitzipcode: { sqlType: "text", parser: nullForcingTextParser },
            unitcity: { sqlType: "text", parser: nullForcingTextParser },
            unitemail: { sqlType: "text", parser: nullForcingTextParser },
            phone1: { sqlType: "text", parser: nullForcingTextParser },
            unit24_7: { sqlType: "boolean", parser: numericBooleanParser },
            areacode: { sqlType: "integer", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser }
        }
    },
    departments: {
        tableName: "departments",
        columns: {
            unitcode: { sqlType: "integer", parser: codeNumericParser },
            departmentcode: { sqlType: "integer", parser: codeNumericParser },
            departmentname: { sqlType: "text", parser: nullForcingTextParser },
            startdate: { sqlType: "date", parser: nonNullDateParser },
            enddate: { sqlType: "date", parser: nonNullDateParser },
            departmentaddress: { sqlType: "text", parser: nullForcingTextParser },
            departmentzipcode: { sqlType: "text", parser: nullForcingTextParser },
            departmentcity: { sqlType: "text", parser: nullForcingTextParser },
            departmentemail: { sqlType: "text", parser: nullForcingTextParser },
            phone: { sqlType: "text", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser }
        }
    },
    placements: {
        tableName: "placements",
        columns: {
            placementnbr: { sqlType: "integer", parser: nullForcingTextParser },
            personid: { sqlType: "text", parser: nullForcingTextParser },
            placementunitcode: { sqlType: "integer", parser: codeNumericParser },
            placementdepartmentcode: { sqlType: "integer", parser: codeNumericParser },
            placementchildminder: { sqlType: "text", parser: nullForcingTextParser },
            startdate: { sqlType: "date", parser: nullDateParser },
            enddate: { sqlType: "date", parser: nullDateParser },
            guid: { sqlType: "text", parser: nullForcingTextParser }
        }
    },
    placementextents: {
        tableName: "placementextents",
        columns: {
            placementnbr: { sqlType: "integer", parser: codeNumericParser },
            extentnbr: { sqlType: "integer", parser: codeNumericParser },
            startdate: { sqlType: "date", parser: nullDateParser },
            enddate: { sqlType: "date", parser: nullDateParser },
            hours: { sqlType: "numeric", parser: nullForcingTextParser },
            days: { sqlType: "integer", parser: nullForcingTextParser },
            extentcode: { sqlType: "integer", parser: codeNumericParser },
            guid: { sqlType: "text", parser: nullForcingTextParser }
        }
    },
    feedeviations: {
        tableName: "feedeviations",
        columns: {
            placementnbr: { sqlType: "integer", parser: codeNumericParser },
            rownbr: { sqlType: "integer", parser: codeNumericParser },
            serviceform: { sqlType: "integer", parser: codeNumericParser },
            deviationtype: { sqlType: "integer", parser: codeNumericParser },
            startdate: { sqlType: "date", parser: nullDateParser },
            enddate: { sqlType: "date", parser: nullDateParser },
            sum: { sqlType: "numeric", parser: nullForcingTextParser },
            procent: { sqlType: "numeric", parser: nullForcingTextParser },
            hours: { sqlType: "numeric", parser: nullForcingTextParser },
            days: { sqlType: "integer", parser: nullForcingTextParser },
            extentcode: { sqlType: "integer", parser: codeNumericParser },
            guid: { sqlType: "text", parser: nullForcingTextParser }
        }
    },
    decisions: {
        tableName: "decisions",
        columns: {
            personid: { sqlType: "text", parser: nullForcingTextParser },
            decisiontype: { sqlType: "integer", parser: codeNumericParser },
            decisionstatus: { sqlType: "integer", parser: codeNumericParser },
            decisionunitcode: { sqlType: "integer", parser: codeNumericParser },
            decisionchildminder: { sqlType: "text", parser: nullForcingTextParser },
            startdate: { sqlType: "date", parser: nullDateParser },
            enddate: { sqlType: "date", parser: nullDateParser },
            decisiondate: { sqlType: "date", parser: nullDateParser },
            caseworker: { sqlType: "text", parser: nullForcingTextParser },
            decisionmaker: { sqlType: "text", parser: nullForcingTextParser },
            decisionnbr: { sqlType: "integer", parser: nullForcingTextParser },
            extent: { sqlType: "integer", parser: codeNumericParser },
            days: { sqlType: "integer", parser: nullForcingTextParser },
            paydecision: { sqlType: "numeric", parser: nullForcingTextParser },
            factor: { sqlType: "numeric", parser: nullForcingTextParser },
            ceiling: { sqlType: "numeric", parser: nullForcingTextParser },
            familysize: { sqlType: "integer", parser: nullForcingTextParser },
            sum: { sqlType: "numeric", parser: nullForcingTextParser },
            totalsum: { sqlType: "numeric", parser: nullForcingTextParser },
            grandtotal: { sqlType: "numeric", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser }
        },
        primaryKeys:["guid"],
    },
    childminders: {
        tableName: "childminders",
        columns: {
            personid: { sqlType: "text", parser: nullForcingTextParser },
            area: { sqlType: "integer", parser: codeNumericParser },
            startdate: { sqlType: "date", parser: nullDateParser },
            enddate: { sqlType: "date", parser: nullDateParser },
            phonenbr: { sqlType: "text", parser: nullForcingTextParser },
            email: { sqlType: "text", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser }
        }
    }
}

export const extTableMapping: TypeMapping = {
    evaka_areas: {
        tableQueryFunction: createAreaTableQuery,
        tableName: "evaka_areas",
        columns: {
            id: { sqlType: "uuid", parser: nullForcingTextParser },
            name: { sqlType: "text", parser: nullForcingTextParser },
            short_name: { sqlType: "text", parser: nullForcingTextParser }
        }
    },
    extentmap: {
        tableName: "extentmap",
        columns: {
            effica_id: { sqlType: "integer", parser: stringToNumericParser },
            days: { sqlType: "integer", parser: nullForcingTextParser },
            evaka_id: { sqlType: "uuid", parser: nullForcingTextParser }
        }
    },
    unitmap: {
        tableName: "unitmap",
        columns: {
            effica_id: { sqlType: "integer", parser: stringToNumericParser },
            evaka_id: { sqlType: "uuid", parser: nullForcingTextParser }
        }
    },
    childmindermap: {
        tableName: "childmindermap",
        columns: {
            effica_id: { sqlType: "text", parser: nullForcingTextParser },
            evaka_id: { sqlType: "uuid", parser: nullForcingTextParser }
        }
    },
    evaka_unit_manager: {
        tableQueryFunction: createUnitManagerTableQuery,
        tableName: "evaka_unit_manager",
        columns: {
            id:
                { sqlType: "uuid", parser: nullForcingTextParser },
            name:
                { sqlType: "text", parser: nullForcingTextParser },
            phone:
                { sqlType: "text", parser: nullForcingTextParser },
            email:
                { sqlType: "text", parser: nullForcingTextParser }
        }
    },
    evaka_daycare: {
        tableQueryFunction: createDaycareTableQuery,
        tableName: "evaka_daycare",
        columns: {
            id:
                { sqlType: "uuid", parser: nullForcingTextParser },
            name:
                { sqlType: "text", parser: nullForcingTextParser },
            type:
                { sqlType: "text[]", parser: csvStringArrayParser },
            care_area_id:
                { sqlType: "uuid", parser: nullForcingTextParser },
            phone:
                { sqlType: "text", parser: nullForcingTextParser },
            url:
                { sqlType: "text", parser: nullForcingTextParser },
            backup_location:
                { sqlType: "text", parser: nullForcingTextParser },
            opening_date:
                { sqlType: "date", parser: nullDateParser },
            closing_date:
                { sqlType: "date", parser: nullDateParser },
            email:
                { sqlType: "text", parser: nullForcingTextParser },
            schedule:
                { sqlType: "text", parser: nullForcingTextParser },
            additional_info:
                { sqlType: "text", parser: nullForcingTextParser },
            cost_center:
                { sqlType: "text", parser: nullForcingTextParser },
            upload_to_varda:
                { sqlType: "boolean", parser: csvStringBooleanParser },
            decision_daycare_name:
                { sqlType: "text", parser: nonNullTextParser },
            decision_preschool_name:
                { sqlType: "text", parser: nonNullTextParser },
            street_address:
                { sqlType: "text", parser: nonNullTextParser },
            postal_code:
                { sqlType: "text", parser: nonNullTextParser },
            post_office:
                { sqlType: "text", parser: nonNullTextParser },
            mailing_po_box:
                { sqlType: "text", parser: nullForcingTextParser },
            location:
                { sqlType: "point", parser: nullForcingTextParser },
            mailing_street_address:
                { sqlType: "text", parser: nullForcingTextParser },
            mailing_postal_code:
                { sqlType: "text", parser: nullForcingTextParser },
            mailing_post_office:
                { sqlType: "text", parser: nullForcingTextParser },
            invoiced_by_municipality:
                { sqlType: "boolean", parser: csvStringBooleanParser },
            provider_type:
                { sqlType: "text", parser: nullForcingTextParser },
            language:
                { sqlType: "text", parser: nullForcingTextParser },
            upload_to_koski:
                { sqlType: "boolean", parser: csvStringBooleanParser },
            operation_days:
                { sqlType: "integer[]", parser: csvStringArrayParser },
            ghost_unit:
                { sqlType: "boolean", parser: csvStringBooleanParser },
            daycare_apply_period:
                { sqlType: "daterange", parser: nullForcingTextParser },
            preschool_apply_period:
                { sqlType: "daterange", parser: nullForcingTextParser },
            round_the_clock:
                { sqlType: "boolean", parser: csvStringBooleanParser },
            unit_manager_id:
                { sqlType: "uuid", parser: nullForcingTextParser }
        }
    }
}
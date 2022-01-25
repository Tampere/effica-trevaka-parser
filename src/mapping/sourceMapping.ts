// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { config } from "../config"
import { createAreaTableQuery, createDaycareTableQuery, createGenericExclusionTableQuery, createUnitManagerTableQuery } from "../db/evaka"
import { activityParser, codeNumericParser, csvStringArrayParser, csvStringBooleanParser, nonNullTextParser, nullDateParser, nullForcingTextParser, numericBooleanParser, stringToNumericParser } from "../parsers"
import { TypeMapping } from "../types"


// dateformat in effica-data: yyyymmdd
// booleans encoded as 0/1 (apart from code activity)
// missing coded value seems to be 0, never null

// NOTE! Effica import (XML) default generic table formation creates a data table, an exclusion table and a filtered view,
// make sure to provide replacements if default is overridden (CSV imports don't need any additions)
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
            applicationtype: { sqlType: "integer", parser: nullForcingTextParser },
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
            startdate: { sqlType: "date", parser: nullDateParser },
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
    persons: {
        tableName: "persons",
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
        primaryKeys: ["guid"]
    },
    specialneeds: {
        tableName: "specialneeds",
        columns: {
            personid: { sqlType: "text", parser: nullForcingTextParser },
            specialneedcode: { sqlType: "integer", parser: nullForcingTextParser },
            startdate: { sqlType: "date", parser: nullDateParser },
            enddate: { sqlType: "date", parser: nullDateParser },
            specialneednbr: { sqlType: "integer", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser },
        },
    },
    specialmeans: {
        tableName: "specialmeans",
        columns: {
            personid: { sqlType: "text", parser: nullForcingTextParser },
            specialneedcode: { sqlType: "integer", parser: nullForcingTextParser },
            mean: { sqlType: "integer", parser: nullForcingTextParser },
            startdate: { sqlType: "date", parser: nullDateParser },
            enddate: { sqlType: "date", parser: nullDateParser },
            specialneednbr: { sqlType: "integer", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser },
        },
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
            startdate: { sqlType: "date", parser: nullDateParser },
            enddate: { sqlType: "date", parser: nullDateParser },
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
            startdate: { sqlType: "date", parser: nullDateParser },
            enddate: { sqlType: "date", parser: nullDateParser },
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
        primaryKeys: ["guid"],
    },
    paydecisions: {
        tableName: "paydecisions",
        columns: {
            headoffamily: { sqlType: "text", parser: nullForcingTextParser },
            internaldecisionnumber: { sqlType: "integer", parser: nullForcingTextParser },
            startdate: { sqlType: "date", parser: nullDateParser },
            enddate: { sqlType: "date", parser: nullDateParser },
            fee: { sqlType: "numeric", parser: nullForcingTextParser },
            caseworker: { sqlType: "text", parser: nullForcingTextParser },
            decisionmaker: { sqlType: "text", parser: nullForcingTextParser },
            decisionnumber: { sqlType: "integer", parser: nullForcingTextParser },
            decisiondate: { sqlType: "date", parser: nullDateParser },
            status: { sqlType: "integer", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser },
        },
        primaryKeys: ["guid"],
    },
    paydecisionrows: {
        tableName: "paydecisionrows",
        columns: {
            internalid: { sqlType: "integer", parser: nullForcingTextParser },
            rownumber: { sqlType: "integer", parser: nullForcingTextParser },
            person: { sqlType: "text", parser: nullForcingTextParser },
            income: { sqlType: "numeric", parser: nullForcingTextParser },
            specification: { sqlType: "text", parser: nullForcingTextParser },
            fee: { sqlType: "numeric", parser: nullForcingTextParser },
            rowtype: { sqlType: "integer", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser },
        },
        primaryKeys: ["guid"],
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
    },
    dailyjournals: {
        tableName: "dailyjournals",
        columns: {
            dailyjournalid: { sqlType: "integer", parser: nullForcingTextParser },
            unit: { sqlType: "integer", parser: nullForcingTextParser },
            department: { sqlType: "integer", parser: nullForcingTextParser },
            childminder: { sqlType: "text", parser: nullForcingTextParser },
            openingdays: { sqlType: "text", parser: nullForcingTextParser },
            period: { sqlType: "text", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser },
        },
    },
    dailyjournalrows: {
        tableName: "dailyjournalrows",
        columns: {
            dailyjournalid: { sqlType: "integer", parser: nullForcingTextParser },
            personid: { sqlType: "text", parser: nullForcingTextParser },
            extrachild: { sqlType: "text", parser: nullForcingTextParser },
            reportcode01: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode02: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode03: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode04: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode05: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode06: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode07: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode08: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode09: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode10: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode11: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode12: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode13: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode14: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode15: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode16: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode17: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode18: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode19: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode20: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode21: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode22: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode23: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode24: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode25: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode26: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode27: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode28: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode29: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode30: { sqlType: "integer", parser: nullForcingTextParser },
            reportcode31: { sqlType: "integer", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser },
        },
    },
    timestampheaders: {
        tableName: "timestampheaders",
        columns: {
            rownumber: { sqlType: "integer", parser: nullForcingTextParser },
            childminder: { sqlType: "text", parser: nullForcingTextParser },
            period: { sqlType: "text", parser: nullForcingTextParser },
            rowtype: { sqlType: "text", parser: nullForcingTextParser },
            unit: { sqlType: "integer", parser: nullForcingTextParser },
            department: { sqlType: "integer", parser: nullForcingTextParser },
            personid: { sqlType: "text", parser: nullForcingTextParser },
            placementnumber: { sqlType: "integer", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser },
        },
    },
    timestampdetails: {
        tableName: "timestampdetails",
        columns: {
            rownumber: { sqlType: "integer", parser: nullForcingTextParser },
            day: { sqlType: "integer", parser: nullForcingTextParser },
            starttime1: { sqlType: "text", parser: nullForcingTextParser },
            endtime1: { sqlType: "text", parser: nullForcingTextParser },
            starttime2: { sqlType: "text", parser: nullForcingTextParser },
            endtime2: { sqlType: "text", parser: nullForcingTextParser },
            starttime3: { sqlType: "text", parser: nullForcingTextParser },
            endtime3: { sqlType: "text", parser: nullForcingTextParser },
            guid: { sqlType: "text", parser: nullForcingTextParser },
        },
    },
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
            effica_name: { sqlType: "text", parser: nullForcingTextParser },
            effica_id: { sqlType: "integer", parser: stringToNumericParser },
            days: { sqlType: "integer", parser: nullForcingTextParser },
            evaka_id: { sqlType: "uuid", parser: nullForcingTextParser },
            evaka_name: { sqlType: "text", parser: nullForcingTextParser }
        }
    },
    unitmap: {
        tableName: "unitmap",
        columns: {
            effica_id: { sqlType: "integer", parser: stringToNumericParser },
            evaka_id: { sqlType: "uuid", parser: nullForcingTextParser },
            name: { sqlType: "text", parser: nullForcingTextParser }
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

    },
    daycare_oid_map: {
        tableName: "daycare_oid_map",
        columns: {
            unit_oid: {
                sqlType: "text", parser: nullForcingTextParser
            },
            organizer_oid: {
                sqlType: "text", parser: nullForcingTextParser
            },
            varda_unit_id: {
                sqlType: "integer", parser: stringToNumericParser
            },
            evaka_id: {
                sqlType: "uuid", parser: nullForcingTextParser
            },
            name: {
                sqlType: "text", parser: nullForcingTextParser
            }
        }
    },
    /*
    to use the exclusion mechanism for any effica import data table:
      1. add a corresponding exclusion import entry like below
        - be sure to define a column subset that is capable of uniquely identifying each row of the original data table
      2. switch transformation query data source from '<migrationSchema>.<tableName>' to '<migrationSchema>.filtered_<tableName>_v'
      3. create your exclusion import csv with file name matching the entry name here
      4. import original data and exclusion data (order of imports should not matter)
    */
    families_exclusion: {
        tableQueryFunction: createGenericExclusionTableQuery,
        tableName: `families${config.exclusionSuffix}`,
        columns: {
            personid: {
                sqlType: "text", parser: nullForcingTextParser
            },
            familynbr: {
                sqlType: "integer", parser: stringToNumericParser
            },
            roleinfamily: {
                sqlType: "text", parser: nullForcingTextParser
            },
            startdate: {
                sqlType: "date", parser: nullDateParser
            },
            enddate: {
                sqlType: "date", parser: nullDateParser
            }
        }
    },
    placements_exclusion: {
        tableQueryFunction: createGenericExclusionTableQuery,
        tableName: `placements${config.exclusionSuffix}`,
        columns: {
            placementnbr: {
                sqlType: "integer", parser: stringToNumericParser
            }
        }

    },
    incomerows_exclusion: {
        tableQueryFunction: createGenericExclusionTableQuery,
        tableName: `incomerows${config.exclusionSuffix}`,
        columns: {
            personid: { sqlType: "text", parser: nullForcingTextParser },
            startdate: { sqlType: "date", parser: nullDateParser },
            enddate: { sqlType: "date", parser: nullDateParser },
            incomeperiod: { sqlType: "integer", parser: nullForcingTextParser },
            incometype: { sqlType: "integer", parser: nullForcingTextParser },
            summa: { sqlType: "numeric", parser: nullForcingTextParser }
        }
    },
    unwantedunits: {
        tableName: "unwantedunits",
        columns: {
            effica_id: { sqlType: "integer", parser: stringToNumericParser },
            name: { sqlType: "text", parser: nullForcingTextParser }
        }
    },

}

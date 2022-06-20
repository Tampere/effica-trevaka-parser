// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { DateTime } from "luxon"

export const nullForcingTextParser = (v: undefined | string | null | number): string | null => v != null && v !== "" && v !== "&#x20;" ? `${v}` : null
export const nullableTextParser = (v: undefined | string | null | number): string | null => v != null ? `${v}` : null
export const nonNullTextParser = (v: undefined | string | null | number): string => v != null ? `${v}` : ""
export const activityParser = (v: string): boolean => v?.toUpperCase() === "A"
export const numericBooleanParser = (v: undefined | number): boolean => v === 1

export const forceNullValue = (v: any) => null

//indefinite time = null or infinity
export const nullDateParser = (v: number | string): string | null => {
    const stringValue = `${v}`
    return stringValue === "" || v == null || stringValue === "99999999" || stringValue === "99991231" ? null : DateTime.fromISO(stringValue).toISODate()
}
export const dateParser = (format: string = "yyyy-MM-dd") => (text: string) => DateTime.fromFormat(text, format)
export const booleanParser = (v: boolean): boolean => v === true
export const codeNumericParser = (v: number | null | undefined) => v == null || v === 0 ? null : v
export const stringToNumericParser = (v: null | string) => v == null || v === "" || v === " " ? null : +v

//FIXME: currently no way to set defaults for import tables, null needs to be interpreted (should it be evaka default instead)
export const csvStringArrayParser = (v: undefined | string): string => v ? v : "{}"
export const csvStringBooleanParser = (v: undefined | string): boolean => v?.toLowerCase() === "t"

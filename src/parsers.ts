import { DateTime } from "luxon"

export const nullForcingTextParser = (v: undefined | string | null | number): string | null => v != null && v !== "" ? `${v}` : null
export const nullableTextParser = (v: undefined | string | null | number): string | null => v != null ? `${v}` : null
export const nonNullTextParser = (v: undefined | string | null | number): string => v != null ? `${v}` : ""
export const activityParser = (v: string): boolean => v?.toUpperCase() === "A"
export const numericBooleanParser = (v: undefined | number): boolean => v === 1

//max time = null or max time = 1E8 days after epoch?
export const dateParser = (v: string): string | null => v === "" || v == null || v === "99999999" ? null : DateTime.fromISO(v).toISODate()
export const booleanParser = (v: boolean): boolean => v === true
export const codeNumericParser = (v: number | null | undefined) => v == null || v === 0 ? null : v
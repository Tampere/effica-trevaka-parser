export const nullForcingTextParser = (v: undefined | string | null | number): string | null => v != null && v !== "" ? `${v}` : null
export const nullableTextParser = (v: undefined | string | null | number): string | null => v != null ? `${v}` : null
export const nonNullTextParser = (v: undefined | string | null | number): string => v != null ? `${v}` : ""
export const activityParser = (v: string): boolean => v?.toUpperCase() === "A"
export const dateParser = (v: string): string | null => v === "" ? null : v
export const booleanParser = (v: boolean): boolean => v === true
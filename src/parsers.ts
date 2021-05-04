export const textParser = (v: any): string | null => v != null ? (typeof v === "string" ? v : String(v)) : v
export const activityParser = (v: string): boolean => v != null && v.toUpperCase() === "A"
export const dateParser = (v: string): string | null => v === "" ? null : v
export const booleanParser = (v: boolean): boolean => v === true
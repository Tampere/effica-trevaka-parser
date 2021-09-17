import { ITask } from "pg-promise";
import { getMigrationSchemaPrefix } from "../util/queryTools";

export type UnitMap = Record<number, string>;
export const getUnitMap = async <T>(t: ITask<T>): Promise<UnitMap> => {
    const units = await t.manyOrNone<{ effica_id: number; evaka_id: string }>(
        `
        SELECT effica_id, evaka_id
        FROM ${getMigrationSchemaPrefix()}unitmap
        `
    );
    return units.reduce((previousValue, currentValue) => {
        return {
            ...previousValue,
            [currentValue.effica_id]: currentValue.evaka_id,
        };
    }, {});
};

export type ExtentMap = Record<number, { id: string; name: string }>;
export const getExtentMap = async <T>(t: ITask<T>): Promise<ExtentMap> => {
    const extents = await t.manyOrNone<{
        effica_id: number;
        evaka_id: string;
        evaka_name: string;
    }>(
        `
        SELECT effica_id, evaka_id, sno.name AS evaka_name
        FROM ${getMigrationSchemaPrefix()}extentmap em
        LEFT JOIN service_need_option sno ON sno.id = em.evaka_id
        `
    );
    return extents.reduce((previousValue, currentValue) => {
        return {
            ...previousValue,
            [currentValue.effica_id]: {
                id: currentValue.evaka_id,
                name: currentValue.evaka_name,
            },
        };
    }, {});
};

export type ChildminderMap = Record<string, string>;
export const getChildminderMap = async <T>(
    t: ITask<T>
): Promise<ChildminderMap> => {
    const data = await t.manyOrNone<{ effica_id: string; evaka_id: string }>(
        `
        SELECT effica_id, evaka_id
        FROM ${getMigrationSchemaPrefix()}childmindermap
        `
    );
    return data.reduce(
        (previousValue, currentValue) => ({
            ...previousValue,
            [currentValue.effica_id]: currentValue.evaka_id,
        }),
        {}
    );
};

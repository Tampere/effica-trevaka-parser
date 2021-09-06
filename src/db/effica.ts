import { ITask } from "pg-promise";
import { EfficaApplication, EfficaApplicationRow } from "../types/effica";
import { getMigrationSchemaPrefix } from "../util/queryTools";

export const findApplications = async <T>(t: ITask<T>) => {
    return await t.manyOrNone<EfficaApplication>(
        `
        SELECT *
        FROM ${getMigrationSchemaPrefix()}applications
        `
    );
};

export const findRowsByApplication = async <T>(
    t: ITask<T>,
    application: EfficaApplication
): Promise<EfficaApplicationRow[]> => {
    // TODO: implement
    return Promise.resolve([]);
    /*
    return await t.manyOrNone<EfficaApplicationRow>(
        `
        SELECT *
        FROM ${getMigrationSchema}applicationrows
        WHERE ???
        ORDER BY priority
        `
    );
    */
};

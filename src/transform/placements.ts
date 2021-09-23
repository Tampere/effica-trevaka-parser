import { ITask } from "pg-promise";
import { config } from "../config";
import migrationDb from "../db/db";
import { runQuery, runQueryFile, selectFromTable } from "../util/queryTools";

export const transformPlacementsData = async (returnAll: boolean = false) => {
    return migrationDb.tx(async (t) => {
        return {
            ...(await transformPlacements(t, returnAll)),
            serviceNeeds: await transformExtents(t, returnAll),
        };
    });
};

const queryParameters = {
    migrationSchema: config.migrationSchema,
    extensionSchema: config.extensionSchema,
};

const transformPlacements = async <T>(t: ITask<T>, returnAll: boolean) => {
    await runQueryFile("functions.sql", t, queryParameters);
    await runQueryFile("transform-placement.sql", t, queryParameters);

    const placements = await runQuery(
        selectFromTable("evaka_placement", config.migrationSchema, returnAll, [
            "effica_placement_nbr",
        ]),
        t,
        true
    );
    const overlapping = await runQuery(
        selectFromTable(
            "evaka_placement_overlapping",
            config.migrationSchema,
            returnAll,
            ["effica_placement_nbr"]
        ),
        t,
        true
    );
    return { placements, overlapping };
};

const transformExtents = async <T>(t: ITask<T>, returnAll: boolean) => {
    await runQueryFile("transform-placementextent.sql", t, queryParameters);

    return await runQuery(
        selectFromTable(
            "evaka_service_need",
            config.migrationSchema,
            returnAll,
            ["effica_placement_nbr", "effica_extent_nbr"]
        ),
        t,
        true
    );
};

import migrationDb from "../db/db";
import {
    getMigrationSchemaPrefix,
    runQuery,
    wrapWithReturning,
} from "../util/queryTools";

export const transferFamiliesData = async (returnAll: boolean = false) => {
    return {
        children: await transferFridgeChildData(returnAll),
        partners: await transferFridgePartnerData(returnAll),
    };
};

const transferFridgeChildData = async (returnAll: boolean) => {
    const insertQueryPart = `
    INSERT INTO fridge_child
        (child_id, head_of_child, start_date, end_date, conflict)
    SELECT
        child_id, head_of_family, start_date, end_date, false
    FROM ${getMigrationSchemaPrefix()}evaka_fridge_child
    `;
    const insertQuery = wrapWithReturning(
        "fridge_child",
        insertQueryPart,
        returnAll
    );

    return await migrationDb.tx(async (t) => {
        return await runQuery(insertQuery, t, true);
    });
};

const transferFridgePartnerData = async (returnAll: boolean) => {
    const insertQueryPart = `
    INSERT INTO fridge_partner
        (partnership_id, indx, person_id, start_date, end_date, conflict)
    SELECT
        partnership_id, indx, person_id, start_date, end_date, false
    FROM ${getMigrationSchemaPrefix()}evaka_fridge_partner
    `;
    const insertQuery = wrapWithReturning(
        "fridge_partner",
        insertQueryPart,
        returnAll
    );

    return await migrationDb.tx(async (t) => {
        return await runQuery(insertQuery, t, true);
    });
};

// SPDX-FileCopyrightText: 2021-2022 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "../db/db";
import {
    baseQueryParameters,
    runQuery,
    wrapWithReturning,
} from "../util/queryTools";

export const transformPedagogicalDocumentData = async (
    returnAll: boolean = false
) => {
    return await migrationDb.tx(async (t) => {
        await runQuery(tableSql, t, false, baseQueryParameters);
        const data = await runQuery(
            wrapWithReturning(
                "evaka_pedagogical_document",
                transformSql,
                returnAll
            ),
            t,
            true,
            baseQueryParameters
        );
        await runQuery(todoSql, t, false, baseQueryParameters);
        return { data, todo: [] };
    });
};

const tableSql = `
    DROP TABLE IF EXISTS $(migrationSchema:name).evaka_pedagogical_document;
    CREATE TABLE $(migrationSchema:name).evaka_pedagogical_document (
        -- pedagogical_document
        id UUID PRIMARY KEY DEFAULT $(extensionSchema:name).uuid_generate_v1mc(),
        child_id UUID REFERENCES $(migrationSchema:name).evaka_person,
        description TEXT NOT NULL,
        created TIMESTAMP WITH TIME ZONE NOT NULL,
        updated TIMESTAMP WITH TIME ZONE NOT NULL,
        -- attachment
        attachment_id UUID UNIQUE  DEFAULT $(extensionSchema:name).uuid_generate_v1mc(),
        name TEXT NOT NULL,
        content_type TEXT NOT NULL,
        uploaded_to_s3 BOOL NOT NULL DEFAULT FALSE
    );
`;

const transformSql = `
    INSERT INTO $(migrationSchema:name).evaka_pedagogical_document
        (child_id, description, created, updated, name, content_type)
    SELECT
        child.id,
        d.documentname,
        d.archivedate,
        d.archivedate,
        d.filename,
        'application/pdf'
    FROM $(migrationSchema:name).paikky_document d
    LEFT JOIN $(migrationSchema:name).evaka_person child ON child.effica_ssn = d.personconcerned ->> 'PersonalIdentityCode'
`;

const todoSql = `
    DROP TABLE IF EXISTS $(migrationSchema:name).evaka_pedagogical_document_todo;
    CREATE TABLE $(migrationSchema:name).evaka_pedagogical_document_todo AS
    SELECT *, 'TODO' AS reason FROM $(migrationSchema:name).evaka_pedagogical_document WHERE FALSE;

    INSERT INTO $(migrationSchema:name).evaka_pedagogical_document_todo
    SELECT *, 'CHILD MISSING'
    FROM $(migrationSchema:name).evaka_pedagogical_document
    WHERE child_id IS NULL;

    DELETE FROM $(migrationSchema:name).evaka_pedagogical_document
    WHERE id IN (SELECT id FROM $(migrationSchema:name).evaka_pedagogical_document_todo);
`;

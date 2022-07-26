// SPDX-FileCopyrightText: 2021-2022 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";
import { config } from "../config";
import migrationDb from "../db/db";
import { ensurePäikkyUser } from "../db/evaka";
import {
    baseQueryParameters,
    runQuery,
    wrapWithReturning,
} from "../util/queryTools";

export const transferPedagogicalDocumentData = async (
    returnAll: boolean = false
) => {
    return await migrationDb.tx(async (t) => {
        const userId = await ensurePäikkyUser(t);
        const data = await runQuery(
            wrapWithReturning("pedagogical_document", documentSql, returnAll),
            t,
            true,
            {
                ...baseQueryParameters,
                userId,
            }
        );
        await runQuery(
            wrapWithReturning("attachment", attachmentSql, returnAll),
            t,
            true,
            {
                ...baseQueryParameters,
                userId,
            }
        );
        return data;
    });
};

const documentSql = `
    INSERT INTO pedagogical_document (id, child_id, description, created, created_by, updated, updated_by)
    SELECT id, child_id, description, created, $(userId), updated, $(userId)
    FROM $(migrationSchema:name).evaka_pedagogical_document
`;

const attachmentSql = `
    INSERT INTO attachment (id, created, updated, name, content_type, pedagogical_document_id, uploaded_by)
    SELECT attachment_id, created, updated, name, content_type, id, $(userId)
    FROM $(migrationSchema:name).evaka_pedagogical_document
`;

export const transferPedagogicalDocumentPdf = async (path: string) => {
    const attachments = await migrationDb.tx(
        async (t) =>
            await t.manyOrNone<{ id: string; name: string }>(
                selectSql,
                baseQueryParameters
            )
    );
    const { aws } = config;
    const client = new S3Client({
        region: aws.region,
        endpoint: aws.s3.endpoint,
    });

    const responses = [];
    for (const attachment of attachments) {
        // basically `echo 'ä' | iconv -t latin1 | iconv -f windows-1251`
        // but didn't work correctly for every letter for some reason:
        // ö->ц but the filename was ╢
        const encodedName = attachment.name
            .replace(/å/g, "├е")
            .replace(/Å/g, "├Е")
            .replace(/ä/g, "├д")
            .replace(/Ä/g, "├Д")
            .replace(/ö/g, "├╢")
            .replace(/Ö/g, "├Ц")
            .replace(/é/g, "├й")
            .replace(/ß/g, "├Я")
            .replace(/ç/g, "├з")
            .replace(/ã/g, "├г")
            .replace(/á/g, "├б")
            .replace(/ó/g, "├│")
            .replace(/ú/g, "├║")
            .replace(/í/g, "├н")
            .replace(/õ/g, "├╡");
        const file = `${path}/${encodedName}`;
        console.log(file);
        if (!fs.existsSync(file)) throw Error(`File not found ${file}`);
        const fileStream = fs.createReadStream(file);
        const response = await client.send(
            new PutObjectCommand({
                Bucket: aws.s3.bucket,
                Key: attachment.id,
                Body: fileStream,
            })
        );
        await migrationDb.tx(
            async (t) =>
                await t.none(updateSql, {
                    ...baseQueryParameters,
                    id: attachment.id,
                })
        );
        responses.push(response);
    }
    return responses;
};

const selectSql =
    "SELECT attachment_id AS id, name FROM $(migrationSchema:name).evaka_pedagogical_document WHERE NOT uploaded_to_s3";
const updateSql =
    "UPDATE $(migrationSchema:name).evaka_pedagogical_document SET uploaded_to_s3 = TRUE WHERE attachment_id = $(id)";

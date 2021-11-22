// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import request from "supertest"
import app from "../app"
import db from "../db/db"
import { dropTable } from "./queryTools"

export const importTable = async (tableName: string) => {
    const importUrl = "/import"
    const queryObject = {
        path: `/integration-test/data/${tableName}`,
        returnAll: "true",
    }

    const response = await request(app).get(importUrl).query(queryObject)
    if (response.error) {
        console.log(`Import error for ${tableName}`)
        console.error(response.error.text)
    }
    return response.body
}

export const setupTable = async (tableName: string) => {
    await db.tx(async t => {
        return dropTable(tableName, t)
    })
    return await importTable(tableName)
}

export const setupTables = async (tables: string[]) => {
    const responses: Record<string, any> = {}
    for (const name of tables) {
        responses[name] = await setupTable(name)
    }
    return responses
}

export const setupTransformation = async (name: string) => {
    const queryObject = {
        returnAll: "true"
    }

    const url = `/transform/${name}`
    const response = await request(app).get(url).query(queryObject)
    if (response.error) {
        console.log(`Transform error at ${name} transformation
        ${response.error.text}`)

    }

    expect(response.status).toBe(200)
    return response.body
}

export const setupTransformations = async (tfs: string[]) => {
    const responses: Record<string, any> = {}
    for (const name of tfs) {
        responses[name] = await setupTransformation(name)
    }
    return responses
}

export const setupTransfer = async (name: string) => {
    const queryObject = {
        returnAll: "true"
    }

    const url = `/transfer/${name}`
    const response = await request(app).get(url).query(queryObject)
    expect(response.status).toBe(200)
    return response.body
}

export const setupTransfers = async (tfs: string[]) => {
    const responses: Record<string, any> = {}
    for (const name of tfs) {
        responses[name] = await setupTransfer(name)
    }
    return responses
}

export const cleanTables = async (tfs: string[]) => {
    return await db.tx(async t => {
        for (const tfName in tfs) {
            await dropTable(tfName, t)
        }
    })
}
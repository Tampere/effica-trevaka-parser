// SPDX-FileCopyrightText: 2021-2022 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import express from "express";
import { config } from "../config";
import migrationDb from "../db/db";
import { VardaUnitMappingRow } from "../types/mappings";
import { ErrorWithCause } from "../util/error";
import { AxiosVardaClient, VardaV1Person, VardaV1Unit } from "../util/varda-client";
import { MappingComparison } from "../types/mappings";

const router = express.Router();
router.get("/person-by-ssn/:personSsn", async (req, res, next) => {
    try {
        const client = new AxiosVardaClient()
        const ssn: string = req.params.personSsn
        if (ssn && ssn.length > 0) {
            const result = await client.getPersonBySsn(ssn)
            res.status(200).json(result);
        } else {
            res.status(401).json("Invalid SSN")
        }

    } catch (err) {
        next(
            new ErrorWithCause(
                `Fetching person data failed:`,
                err
            )
        );
    }
});

router.get("/person-by-varda-id/:vardaId", async (req, res, next) => {
    try {
        const client = new AxiosVardaClient()
        const vardaId: string = req.params.vardaId

        if (vardaId && vardaId.length > 0) {
            const personUrl: string = `${config.varda.apiUrl}/v1/henkilot/${vardaId}/`
            const result = await client.getByUrl(personUrl)
            res.status(200).json(result);
        } else {
            res.status(400).json("Invalid person id")
        }

    } catch (err) {
        next(
            new ErrorWithCause(
                `Fetching person data failed:`,
                err
            )
        );
    }
});

router.get("/child-by-varda-id/:vardaId", async (req, res, next) => {
    try {
        const client = new AxiosVardaClient()
        const vardaId: string = req.params.vardaId

        if (vardaId && vardaId.length > 0) {
            const childUrl: string = `${config.varda.apiUrl}/v1/lapset/${vardaId}/`
            const result = await client.getByUrl(childUrl)
            res.status(200).json(result);
        } else {
            res.status(400).json("Invalid child id")
        }

    } catch (err) {
        next(
            new ErrorWithCause(
                `Fetching child data failed:`,
                err
            )
        );
    }
});

router.get("/decisions-by-varda-child-id/:vardaId", async (req, res, next) => {
    try {
        const client = new AxiosVardaClient()
        const vardaId: string = req.params.vardaId

        if (vardaId && vardaId.length > 0) {
            const decisionUrl: string = `${config.varda.apiUrl}/v1/varhaiskasvatuspaatokset/?lapsi=${vardaId}`
            const result = await client.getByUrl(decisionUrl)
            res.status(200).json(result);
        } else {
            res.status(400).json("Invalid child id")
        }

    } catch (err) {
        next(
            new ErrorWithCause(
                `Fetching child data failed:`,
                err
            )
        );
    }
});

router.get("/child-data-by-varda-id/:vardaId", async (req, res, next) => {
    try {
        const client = new AxiosVardaClient()
        const vardaId: string = req.params.vardaId

        if (vardaId && vardaId.length > 0) {
            const totalDataUrl: string = `${config.varda.apiUrl}/v1/lapset/${vardaId}/kooste/`
            const result = await client.getByUrl(totalDataUrl)
            res.status(200).json(result);
        } else {
            res.status(400).json("Invalid input id")
        }

    } catch (err) {
        next(
            new ErrorWithCause(
                `Fetching data failed:`,
                err
            )
        );
    }
});

router.get("/person-data-by-varda-id/:vardaId", async (req, res, next) => {
    try {
        const client = new AxiosVardaClient()
        const vardaId: string = req.params.vardaId

        if (vardaId && vardaId.length > 0) {
            const personUrl: string = `${config.varda.apiUrl}/v1/henkilot/${vardaId}/`
            const result = await client.getByUrl<VardaV1Person>(personUrl)

            if (result) {
                const childResults = await Promise.all(result.lapsi.map(async (childUrl) => {
                    const splitUrl = childUrl.split("/")
                    return await client.getByUrl(`${config.varda.apiUrl}/v1/lapset/${splitUrl[splitUrl.length - 2]}/kooste/`)
                }))
                res.status(200).json({ person: result, childResults: childResults });
            } else {
                res.status(404).json(`Varda person ${vardaId} not found`)
            }


        } else {
            res.status(400).json("Invalid target id")
        }

    } catch (err) {
        next(
            new ErrorWithCause(
                `Fetching child data failed:`,
                err
            )
        );
    }
});

router.get("/units", async (req, res, next) => {
    try {
        const client = new AxiosVardaClient()

        const result = await client.getAllUnits()

        res.status(200).json(result)
    } catch (err) {
        next(
            new ErrorWithCause(
                `Fetching unit data failed:`,
                err
            )
        );
    }
});

router.get("/unit/:vardaUnitId", async (req, res, next) => {
    try {
        const client = new AxiosVardaClient()
        const vardaUnitId: string = req.params.vardaUnitId

        const result = await client.getUnit(vardaUnitId)

        res.status(200).json(result)

    } catch (err) {
        next(
            new ErrorWithCause(
                `Fetching unit data failed:`,
                err
            )
        );
    }
});

router.get("/unit-mapping-check", async (req, res, next) => {
    try {
        const client = new AxiosVardaClient()

        const evakaMapping = await migrationDb.many<VardaUnitMappingRow>(
            `SELECT vu.evaka_daycare_id,
                vu.varda_unit_id,
                d.name,
                d.closing_date IS NOT NULL as is_closed
            FROM varda_unit vu
            JOIN daycare d ON d.id = vu.evaka_daycare_id`)
        const vardaUnits = await client.getAllUnits()
        const vardaUnitsById: Map<Number, VardaV1Unit> = new Map(vardaUnits.map(obj => [obj.id, obj]))

        const matches: MappingComparison[] = [], misses: MappingComparison[] = []
        evakaMapping.forEach((evu) => {
            const matchingVardaUnit = vardaUnitsById.get(+evu.varda_unit_id)
            const comparisonObject = {
                evakaId: evu.evaka_daycare_id,
                vardaId: evu.varda_unit_id,
                evakaName: evu.name,
                vardaName: matchingVardaUnit?.nimi ?? "NOT FOUND",
                evakaIsClosed: evu.is_closed,
                vardaIsClosed: matchingVardaUnit?.paattymis_pvm != null
            }
            if (comparisonObject.vardaName === comparisonObject.evakaName &&
                comparisonObject.evakaIsClosed === comparisonObject.vardaIsClosed) {
                matches.push(comparisonObject)
            } else {
                misses.push(comparisonObject)
            }
        })

        res.status(200).json({ matches, misses })

    } catch (err) {
        next(
            new ErrorWithCause(
                `Fetching unit data failed:`,
                err
            )
        );
    }
});

export default router
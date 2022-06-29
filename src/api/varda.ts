import express from "express";
import { config } from "../config";
import { ErrorWithCause } from "../util/error";
import { AxiosVardaClient, VardaV1Person } from "../util/varda-client";

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

        const result = await client.getUnits()

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

//https://backend.varda-db.csc.fi/api/v1/varhaiskasvatuspaatokset/219957/

export default router
// SPDX-FileCopyrightText: 2021-2022 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import axios, { Axios } from "axios";
import { config } from "../config";

export interface VardaClient {
    getChildren: () => Promise<VardaV1Children>;
    getByUrl: <T>(url: string) => Promise<T | null>;
    getPersonBySsn: (ssn: string) => Promise<VardaV1Person | null>;
}

export interface VardaV1Children {
    count: number;
    next: string | null;
    previous: string | null;
    results: VardaV1Child[];
}

export interface VardaV1Child {
    url: string;
    lahdejarjestelma: string;
    id: number;
    henkilo: string; // person url
    henkilo_oid: string;
    vakatoimija: string | null; // url
    vakatoimija_oid: string | null; // organizer oid when paos_kytkin=false
    oma_organisaatio_nimi?: string;
    oma_organisaatio: string | null; // url
    oma_organisaatio_oid: string | null;
    paos_organisaatio_nimi?: string;
    paos_organisaatio: string | null;
    paos_organisaatio_oid: string | null; // organizer oid when paos_kytkin=true
    paos_kytkin: boolean;
    varhaiskasvatuspaatokset_top: string[]; // urls
    tunniste: string | null;
    muutos_pvm: string;
}

export interface VardaV1Person {
    url: string;
    id: number;
    etunimet: string;
    kutsumanimi: string;
    sukunimi: string;
    henkilo_oid: string;
    syntyma_pvm: string;
    lapsi: string[];
    tyontekija: string[];
    turvakielto: boolean;
}

export class AxiosVardaClient implements VardaClient {
    private httpClient: Axios | null = null;
    private initialize = async () => {
        const { apiUrl, basicAuth } = config.varda;
        if (apiUrl === undefined || basicAuth === undefined) {
            throw Error("Client is not configured");
        }
        if (this.httpClient === null) {
            const token = await this.getToken(apiUrl, basicAuth);
            this.httpClient = axios.create({
                headers: {
                    Authorization: `Token ${token}`,
                },
            });
        }
        return { httpClient: this.httpClient, apiUrl };
    };
    private getToken = async (apiUrl: string, basicAuth: string) => {
        const url = `${apiUrl}/user/apikey/`;
        const { data } = await axios.get<{ token: string }>(url, {
            headers: {
                Authorization: `Basic ${basicAuth}`,
            },
        });
        return data.token;
    };
    getChildren = async () => {
        const { httpClient, apiUrl } = await this.initialize();
        const url = `${apiUrl}/v1/lapset/`;
        const { data } = await httpClient.get<VardaV1Children>(url);
        return data;
    };
    getByUrl = async <T>(url: string) => {
        const { httpClient } = await this.initialize();
        const { status, data } = await httpClient.get<T>(url, {
            validateStatus: (status: number) =>
                (status >= 200 && status < 300) || status === 404,
        });
        if (status === 404) {
            return null;
        }
        return data;
    };
    getPersonBySsn = async (ssn: string) => {
        const { httpClient, apiUrl } = await this.initialize();
        const url = `${apiUrl}/v1/hae-henkilo/`;
        const { status, data } = await httpClient.post<VardaV1Person>(
            url,
            {
                henkilotunnus: ssn,
            },
            {
                validateStatus: (status: number) =>
                    (status >= 200 && status < 300) || status === 404,
            }
        );
        if (status === 404) {
            return null;
        }
        return data;
    };
}

// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

export type EfficaApplication = {
    personid: string;
    applicationdate: Date;
    placeneed: number;
    specialhandlingtime: number;
    transferapplication: boolean;
    status: number;
    careid: number;
    guid: string;
};

export type EfficaApplicationType = "BOA" | "BOK" | "PRO";

export type EfficaApplicationRow = {
    personid: string;
    priority: number;
    unitcode: number;
    childminder: string | null;
    areacode: string;
    startdate: Date;
    hours: number;
    childmindercare: number;
    unitcare: number;
    days: number;
    extent: number;
    type: EfficaApplicationType | null;
    careid: number;
    guid: string;
};

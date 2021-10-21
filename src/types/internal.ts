// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

export type TransformFunction = (returnAll: boolean) => Promise<any>;
export type TransformOperation = { name: string, function: TransformFunction }
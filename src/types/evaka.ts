// SPDX-FileCopyrightText: 2021 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

export type EvakaPerson = {
    id: string;
    social_security_number: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    language: string | null;
    date_of_birth: Date;
    street_address: string;
    postal_code: string;
    post_office: string;
    nationalities: string[];
    phone: string | null;
    // not complete, add more fields if needed...
};

export type EvakaApplicationType = "CLUB" | "DAYCARE" | "PRESCHOOL";

export type EvakaApplicationFormDocumentV0 = {
    child: EvakaApplicationFormDocumentChildV0;
    guardian: EvakaApplicationFormDocumentGuardianV0;
    otherGuardianAgreementStatus: unknown | null;
    apply: {
        preferredUnits: string[];
        siblingBasis: boolean;
        siblingName: string;
        siblingSsn: string;
    };
    urgent: boolean;
    partTime: boolean;
    serviceNeedOption: { id: string; name: string } | null;
    connectedDaycare: unknown | null;
    preferredStartDate: unknown | null;
    serviceStart: string | null;
    serviceEnd: string | null;
    extendedCare: boolean;
    careDetails: {
        preparatory: boolean | null;
        assistanceNeeded: boolean;
        assistanceDescription: string;
    };
    guardian2: EvakaApplicationFormDocumentGuardianV0 | null;
    hasOtherAdults: boolean;
    otherAdults: unknown[];
    hasOtherChildren: boolean;
    otherChildren: unknown[];
    docVersion: number;
    additionalDetails: {
        allergyType: string;
        dietType: string;
        otherInfo: string;
    };
    maxFeeAccepted: boolean;
    type: EvakaApplicationType;
};

type EvakaApplicationFormDocumentPersonV0 = {
    address: EvakaApplicationFormDocumentAddressV0;
    lastName: string;
    firstName: string;
    restricted: boolean;
    correctingAddress: EvakaApplicationFormDocumentAddressV0;
    hasCorrectingAddress: boolean | null;
    socialSecurityNumber: string;
};

type EvakaApplicationFormDocumentChildV0 = EvakaApplicationFormDocumentPersonV0 & {
    language: string;
    dateOfBirth: Date | null;
    nationality: string;
    childMovingDate: unknown | null;
};

type EvakaApplicationFormDocumentGuardianV0 = EvakaApplicationFormDocumentPersonV0 & {
    email: string | null;
    phoneNumber: string | null;
    guardianMovingDate: unknown | null;
};

type EvakaApplicationFormDocumentAddressV0 = {
    city: string;
    street: string;
    editable: boolean;
    postalCode: string;
};

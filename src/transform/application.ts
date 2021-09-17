import { ITask } from "pg-promise";
import { APPLICATION_TYPE_MAP } from "../constants";
import {
    ChildminderMap,
    ExtentMap,
    getChildminderMap,
    getExtentMap,
    getUnitMap,
    UnitMap,
} from "../db/common";
import migrationDb from "../db/db";
import {
    findApplications,
    findPersonBySSN,
    findRowsByApplication,
} from "../db/effica";
import { findHeadOfChild } from "../db/evaka";
import { EfficaApplication, EfficaApplicationRow } from "../types/effica";
import { EvakaApplicationFormDocumentV0, EvakaPerson } from "../types/evaka";

export const transformApplicationData = async () => {
    await migrationDb.tx(async (t) => {
        const efficaApplications = await findApplications(t);
        const unitMap = await getUnitMap(t);
        const childminderMap = await getChildminderMap(t);
        const extentMap = await getExtentMap(t);
        for (const efficaApplication of efficaApplications) {
            await migrateApplication(
                t,
                efficaApplication,
                unitMap,
                childminderMap,
                extentMap
            );
        }
    });
};

const migrateApplication = async <T>(
    t: ITask<T>,
    efficaApplication: EfficaApplication,
    unitMap: UnitMap,
    childminderMap: ChildminderMap,
    extentMap: ExtentMap
) => {
    const child = await getChildByApplication(t, efficaApplication);
    const guardian = await getHeadOfChild(
        t,
        child,
        efficaApplication.applicationdate
    );
    const rows = await findRowsByApplication(t, efficaApplication);

    const evakaApplication = await t.one<{ id: string }>(
        `
        INSERT INTO application (
            sentdate,
            duedate,
            guardian_id,
            child_id,
            transferapplication,
            status,
            origin
        ) VALUES (
            $(sentdate),
            null,
            $(guardianId),
            $(childId),
            $(transferapplication),
            'SENT'::application_status_type,
            'ELECTRONIC'::application_origin_type
        )
        RETURNING id
        `,
        {
            sentdate: efficaApplication.applicationdate,
            guardianId: guardian.id,
            childId: child.id,
            transferapplication: efficaApplication.transferapplication,
        }
    );

    const document = newDocument(
        child,
        guardian,
        rows,
        childminderMap,
        unitMap,
        extentMap
    );
    await t.none(
        `
        INSERT INTO application_form (application_id, revision, document, latest)
        VALUES ($(applicationId), $(revision), $(document), $(latest))
        `,
        {
            applicationId: evakaApplication.id,
            revision: 1,
            document,
            latest: true,
        }
    );
};

const getChildByApplication = async <T>(
    t: ITask<T>,
    application: EfficaApplication
) => {
    const child = await findPersonBySSN(t, application.personid);
    if (child === null) {
        throw new Error(`Cannot find child in application ${application.guid}`);
    }
    return child;
};

const getHeadOfChild = async <T>(
    t: ITask<T>,
    child: EvakaPerson,
    date: Date
) => {
    const headOfChild = await findHeadOfChild(t, child, date);
    if (headOfChild === null) {
        throw new Error(`Cannot find head of child for ${child.id} at ${date}`);
    }
    return headOfChild;
};

const newDocument = (
    child: EvakaPerson,
    guardian: EvakaPerson,
    rows: EfficaApplicationRow[],
    unitMap: UnitMap,
    childminderMap: ChildminderMap,
    extentMap: ExtentMap
): EvakaApplicationFormDocumentV0 => {
    const preferredUnits = resolveUnits(rows, unitMap, childminderMap);
    const serviceNeedOption = extentMap[rows[0]?.extent] ?? null;
    const preferredStartDate = rows[0]?.startdate ?? null;
    const type = resolveType(rows);
    return {
        ...baseDocumentV0,
        child: {
            address: {
                city: child.post_office,
                street: child.street_address,
                editable: false,
                postalCode: child.postal_code,
            },
            language: child.language ?? "fi",
            lastName: child.last_name ?? "",
            firstName: child.first_name ?? "",
            restricted: false,
            dateOfBirth: child.date_of_birth,
            nationality: child.nationalities[0] ?? "FIN",
            childMovingDate: null,
            correctingAddress: {
                city: "",
                street: "",
                editable: true,
                postalCode: "",
            },
            hasCorrectingAddress: false,
            socialSecurityNumber: child.social_security_number ?? "",
        },
        guardian: {
            email: guardian.email,
            address: {
                city: guardian.post_office,
                street: guardian.street_address,
                editable: false,
                postalCode: guardian.postal_code,
            },
            lastName: guardian.last_name ?? "",
            firstName: guardian.first_name ?? "",
            restricted: false,
            phoneNumber: guardian.phone,
            correctingAddress: {
                city: "",
                street: "",
                editable: true,
                postalCode: "",
            },
            guardianMovingDate: null,
            hasCorrectingAddress: false,
            socialSecurityNumber: guardian.social_security_number ?? "",
        },
        apply: {
            siblingSsn: "",
            siblingName: "",
            siblingBasis: false,
            preferredUnits,
        },
        serviceNeedOption,
        preferredStartDate,
        type,
    };
};

const resolveType = (rows: EfficaApplicationRow[]) => {
    const type = rows.map(({ type }) => type).find((type) => type !== null);
    if (type === undefined || type === null) {
        return "DAYCARE";
    }
    return APPLICATION_TYPE_MAP[type];
};

const asPartial = <T extends Partial<EvakaApplicationFormDocumentV0>>(t: T) =>
    t;

const baseDocumentV0 = asPartial({
    otherGuardianAgreementStatus: null,
    urgent: false,
    partTime: false,
    connectedDaycare: null,
    serviceStart: "",
    serviceEnd: "",
    extendedCare: false,
    careDetails: {
        preparatory: null,
        assistanceNeeded: false,
        assistanceDescription: "",
    },
    guardian2: null,
    hasOtherAdults: false,
    otherAdults: [],
    hasOtherChildren: false,
    otherChildren: [],
    docVersion: 0,
    additionalDetails: {
        allergyType: "",
        dietType: "",
        otherInfo: "",
    },
    maxFeeAccepted: false,
});

const resolveUnits = (
    rows: EfficaApplicationRow[],
    unitMap: UnitMap,
    childminderMap: ChildminderMap
) => {
    return rows
        .map(({ unitcode, childminder }) => {
            if (childminder !== null) {
                return childminderMap[childminder];
            }
            return unitMap[unitcode];
        })
        .filter((unitId) => unitId !== undefined);
};

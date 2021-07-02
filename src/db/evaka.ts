import { ITask } from "pg-promise";
import { EvakaPerson } from "../types/evaka";

export const findPersonBySSN = async <T>(t: ITask<T>, ssn: string) => {
    return await t.oneOrNone<EvakaPerson>(
        `
        SELECT *
        FROM person
        WHERE social_security_number = $(ssn)
        `,
        { ssn }
    );
};

export const getFirstGuardianByChild = async <T>(
    t: ITask<T>,
    child: EvakaPerson
) => {
    const guardian = await t.oneOrNone<EvakaPerson>(
        `
        SELECT p.*
        FROM person p
        JOIN guardian g ON g.guardian_id = p.id
        WHERE g.child_id = $(childId)
        ORDER BY p.id
        LIMIT 1
        `,
        { childId: child.id }
    );
    if (guardian === null) {
        throw new Error(`Cannot find guardian for child ${child.id}`);
    }
    return guardian;
};

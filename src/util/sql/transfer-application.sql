-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

INSERT INTO application
    (id, sentdate, duedate, guardian_id, child_id, transferapplication, status, origin, type, allow_other_guardian_access)
SELECT
    id,
    sentdate,
    duedate,
    guardian_id,
    child_id,
    transferapplication,
    status::application_status_type,
    'ELECTRONIC'::application_origin_type,
    type::application_type,
    false
FROM ${migrationSchema:name}.evaka_application;

UPDATE application
SET document = CASE
        WHEN ea.type IN ('DAYCARE', 'PRESCHOOL') THEN jsonb_build_object(
            'child', jsonb_build_object(
                'firstName', c.first_name,
                'lastName', c.last_name,
                'socialSecurityNumber', COALESCE(c.social_security_number, ''),
                'dateOfBirth', c.date_of_birth,
                'address', jsonb_build_object(
                    'street', c.street_address,
                    'postalCode', c.postal_code,
                    'city', c.post_office,
                    'editable', false
                ),
                'nationality', COALESCE(c.nationalities[1], 'FI'),
                'language', COALESCE(c.language, 'fi'),
                'hasCorrectingAddress', null,
                'correctingAddress', jsonb_build_object(
                    'street', '',
                    'postalCode', '',
                    'city', '',
                    'editable', true
                ),
                'childMovingDate', null,
                'restricted', false
            ),
            'guardian', jsonb_build_object(
                'firstName', g.first_name,
                'lastName', g.last_name,
                'socialSecurityNumber', COALESCE(g.social_security_number, ''),
                'address', jsonb_build_object(
                    'street', g.street_address,
                    'postalCode', g.postal_code,
                    'city', g.post_office,
                    'editable', false
                ),
                'phoneNumber', g.phone,
                'email', g.email,
                'hasCorrectingAddress', null,
                'correctingAddress', jsonb_build_object(
                    'street', '',
                    'postalCode', '',
                    'city', '',
                    'editable', true
                ),
                'guardianMovingDate', null,
                'restricted', false
            ),
            'otherGuardianAgreementStatus', null,
            'apply', jsonb_build_object(
                'preferredUnits', eaf.unit_ids,
                'siblingBasis', false,
                'siblingName', '',
                'siblingSsn', ''
            ),
            'urgent', false,
            'partTime', false,
            'serviceNeedOption', eaf.service_need_options[1],
            'connectedDaycare', null,
            'preferredStartDate', eaf.preferred_start_dates[1],
            'serviceStart', null,
            'serviceEnd', null,
            'extendedCare', false,
            'careDetails', jsonb_build_object(
                'preparatory', null,
                'assistanceNeeded', false,
                'assistanceDescription', ''
            ),
            'guardian2', null,
            'hasOtherAdults', false,
            'otherAdults', jsonb_build_array(),
            'hasOtherChildren', false,
            'otherChildren', jsonb_build_array(),
            'docVersion', 0,
            'additionalDetails', jsonb_build_object(
                'allergyType', '',
                'dietType', '',
                'otherInfo', ''
            ),
            'maxFeeAccepted', false,
            'type', ea.type
        )
        WHEN ea.type = 'CLUB' THEN jsonb_build_object(
            'child', jsonb_build_object(
                'firstName', c.first_name,
                'lastName', c.last_name,
                'socialSecurityNumber', COALESCE(c.social_security_number, ''),
                'dateOfBirth', c.date_of_birth,
                'address', jsonb_build_object(
                    'street', c.street_address,
                    'postalCode', c.postal_code,
                    'city', c.post_office,
                    'editable', false
                ),
                'nationality', COALESCE(c.nationalities[1], 'FI'),
                'language', COALESCE(c.language, 'fi'),
                'hasCorrectingAddress', null,
                'correctingAddress', jsonb_build_object(
                    'street', '',
                    'postalCode', '',
                    'city', '',
                    'editable', true
                ),
                'childMovingDate', null,
                'restricted', false
            ),
            'guardian', jsonb_build_object(
                'firstName', g.first_name,
                'lastName', g.last_name,
                'socialSecurityNumber', COALESCE(g.social_security_number, ''),
                'address', jsonb_build_object(
                    'street', g.street_address,
                    'postalCode', g.postal_code,
                    'city', g.post_office,
                    'editable', false
                ),
                'phoneNumber', g.phone,
                'email', g.email,
                'hasCorrectingAddress', null,
                'correctingAddress', jsonb_build_object(
                    'street', '',
                    'postalCode', '',
                    'city', '',
                    'editable', true
                ),
                'guardianMovingDate', null,
                'restricted', false
            ),
            'apply', jsonb_build_object(
                'preferredUnits', eaf.unit_ids,
                'siblingBasis', false,
                'siblingName', '',
                'siblingSsn', ''
            ),
            'preferredStartDate', eaf.preferred_start_dates[1],
            'wasOnDaycare', false,
            'wasOnClubCare', false,
            'clubCare', jsonb_build_object(
                'assistanceNeeded', false,
                'assistanceDescription', '',
                'assistanceAdditionalDetails', ''
            ),
            'docVersion', 0,
            'additionalDetails', jsonb_build_object(
                'otherInfo', ''
            ),
            'type', 'CLUB'
        )
    END
FROM ${migrationSchema:name}.evaka_application ea
JOIN (
    SELECT
        application_id,
        array_agg(unit_id ORDER BY effica_priority) AS unit_ids,
        array_agg(jsonb_build_object(
            'id', sno.id,
            'nameFi', sno.name_fi,
            'nameSv', sno.name_sv,
            'nameEn', sno.name_en
        ) ORDER BY effica_priority) FILTER (WHERE sno.id IS NOT NULL) AS service_need_options,
        array_agg(preferred_start_date ORDER BY effica_priority) AS preferred_start_dates
    FROM ${migrationSchema:name}.evaka_application_form
    LEFT JOIN service_need_option sno ON sno.id = service_need_option_id
    GROUP BY application_id
) eaf ON eaf.application_id = ea.id
JOIN ${migrationSchema:name}.evaka_person c ON c.id = ea.child_id
JOIN ${migrationSchema:name}.evaka_person g ON g.id = ea.guardian_id;

-- fix transfer applications
UPDATE application a
SET transferapplication = TRUE
WHERE EXISTS (
    SELECT 1
    FROM placement p
    WHERE p.child_id = a.child_id
        AND CASE p.type::text
            WHEN 'DAYCARE_PART_TIME' THEN 'DAYCARE'
            WHEN 'DAYCARE_FIVE_YEAR_OLDS' THEN 'DAYCARE'
            WHEN 'DAYCARE_PART_TIME_FIVE_YEAR_OLDS' THEN 'DAYCARE'
            ELSE p.type::text
            END = a.document ->> 'type'
        AND daterange(p.start_date, p.end_date, '[]') @> to_date((a.document ->> 'preferredStartDate'), 'YYYY-MM-DD')
);

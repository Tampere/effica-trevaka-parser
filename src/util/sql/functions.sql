-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP FUNCTION IF EXISTS ${migrationSchema:name}.parse_ssn_birth_date(text) CASCADE;
CREATE FUNCTION ${migrationSchema:name}.parse_ssn_birth_date(input text) RETURNS date AS $$
DECLARE
    day smallint;
    month smallint;
    year smallint;
BEGIN
    IF length(input) != 11 THEN
        RETURN NULL;
    END IF;
    -- indexing starts from 1!
    day = substr(input, 1, 2)::smallint;
    month = substr(input, 3, 2)::smallint;
    year = substr(input, 5, 2)::smallint;
    CASE substr(input, 7, 1)
        WHEN '+' THEN RETURN make_date(1800 + year, month, day);
        WHEN '-' THEN RETURN make_date(1900 + year, month, day);
        WHEN 'A' THEN RETURN make_date(2000 + year, month, day);
    ELSE
        RAISE EXCEPTION 'Failed to parse birth date from %', input;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS ${migrationSchema:name}.daycare_end_date(text, date) CASCADE;
CREATE FUNCTION ${migrationSchema:name}.daycare_end_date(text, date) RETURNS date AS $$
    WITH dates AS (
        SELECT make_date(
            date_part('year', ${migrationSchema:name}.parse_ssn_birth_date($1) + interval '6 years')::integer,
            7,
            31
        ) AS candidate
    )
    SELECT
        CASE
            WHEN candidate < $2 THEN make_date(date_part('year', $2 + interval '1 years')::integer, 7, 31)
            ELSE candidate
        END
    FROM dates
$$ LANGUAGE SQL IMMUTABLE;

DROP FUNCTION IF EXISTS ${migrationSchema:name}.preschool_daycare_end_date(date) CASCADE;
CREATE FUNCTION ${migrationSchema:name}.preschool_daycare_end_date(input date) RETURNS date AS $$
BEGIN
    IF input > '2023-07-31' THEN
        RAISE EXCEPTION 'Unsupported preschool daycare start date %', input;
    ELSIF input >= '2022-08-01' THEN
        RETURN '2023-07-31';
    ELSIF input >= '2021-08-01' THEN
        RETURN '2022-07-31';
    ELSIF input >= '2020-08-01' THEN
        RETURN '2021-07-31';
    ELSIF input >= '2019-08-01' THEN
        RETURN '2020-07-31';
    ELSIF input >= '2018-08-01' THEN
        RETURN '2019-07-31';
    END IF;
    RAISE EXCEPTION 'Unsupported preschool daycare start date %', input;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

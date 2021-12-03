-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

INSERT INTO child (id)
SELECT DISTINCT child_id
FROM ${migrationSchema:name}.evaka_assistance_need
ON CONFLICT (id) DO NOTHING;

INSERT INTO assistance_need
    (id, updated_by, child_id, start_date, end_date)
SELECT
    id, $(updatedBy), child_id, start_date, end_date
FROM ${migrationSchema:name}.evaka_assistance_need;

INSERT INTO assistance_basis_option_ref
    (need_id, option_id)
SELECT
    an.id, abo.id
FROM assistance_need an
JOIN (
    SELECT id, unnest(bases) AS basis
    FROM ${migrationSchema:name}.evaka_assistance_need
) ean ON ean.id = an.id
JOIN assistance_basis_option abo ON abo.value = ean.basis;

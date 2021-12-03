-- SPDX-FileCopyrightText: 2021 City of Tampere
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

INSERT INTO child (id)
SELECT DISTINCT child_id
FROM ${migrationSchema:name}.evaka_assistance_action
ON CONFLICT (id) DO NOTHING;

INSERT INTO assistance_action
    (id, updated_by, child_id, start_date, end_date)
SELECT
    id, $(updatedBy), child_id, start_date, end_date
FROM ${migrationSchema:name}.evaka_assistance_action;

INSERT INTO assistance_action_option_ref
    (action_id, option_id)
SELECT
    aa.id, aao.id
FROM assistance_action aa
JOIN (
    SELECT id, unnest(actions) AS action
    FROM ${migrationSchema:name}.evaka_assistance_action
) eaa ON eaa.id = aa.id
JOIN assistance_action_option aao ON aao.value = eaa.action;

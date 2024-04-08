-- SPDX-FileCopyrightText: 2023-2024 Tampere region
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

DROP TABLE IF EXISTS $(migrationSchema:name).evaka_async_job_generate_finance_decisions;

CREATE TABLE $(migrationSchema:name).evaka_async_job_generate_finance_decisions
(
    type           TEXT     NOT NULL,
    retry_count    INTEGER  NOT NULL,
    retry_interval INTERVAL NOT NULL,
    payload        JSONB    NOT NULL
);

INSERT INTO $(migrationSchema:name).evaka_async_job_generate_finance_decisions (type, retry_count, retry_interval, payload)
SELECT DISTINCT 'GenerateFinanceDecisions',
                1,
                interval '5 minutes',
                jsonb_build_object(
                        'user', NULL,
                        'person', jsonb_build_object('adultId', head_of_child, 'skipPropagation', true),
                        'dateRange', jsonb_build_object('start', $(financeDecisionMinDate), 'end', NULL)
                )
FROM $(migrationSchema:name).evaka_fridge_child
WHERE head_of_child IS NOT NULL;

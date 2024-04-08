-- SPDX-FileCopyrightText: 2023-2024 Tampere region
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

WITH wrong_fridge_child_data AS (SELECT fridge_child.child_id,
                                        fridge_child.head_of_child       wrong_head_of_child,
                                        evaka_fridge_child.head_of_child correct_head_of_child
                                 FROM fridge_child
                                          JOIN $(migrationSchema:name).evaka_fridge_child
                                               ON fridge_child.child_id = evaka_fridge_child.child_id AND
                                                  fridge_child.head_of_child <> evaka_fridge_child.head_of_child)
UPDATE fridge_child
SET head_of_child = wrong_fridge_child_data.correct_head_of_child
FROM wrong_fridge_child_data
WHERE fridge_child.child_id = wrong_fridge_child_data.child_id
  AND fridge_child.head_of_child = wrong_fridge_child_data.wrong_head_of_child;

UPDATE fridge_child
SET start_date = evaka_fridge_child.start_date,
    end_date   = evaka_fridge_child.end_date
FROM $(migrationSchema:name).evaka_fridge_child
WHERE fridge_child.child_id = evaka_fridge_child.child_id
  AND fridge_child.head_of_child = evaka_fridge_child.head_of_child
  AND (fridge_child.start_date <> evaka_fridge_child.start_date OR
       fridge_child.end_date <> evaka_fridge_child.end_date);

INSERT INTO fridge_child (child_id, head_of_child, start_date, end_date)
SELECT child_id, head_of_child, start_date, end_date
FROM $(migrationSchema:name).evaka_fridge_child
WHERE (evaka_fridge_child.child_id, evaka_fridge_child.head_of_child) NOT IN
      (SELECT child_id, head_of_child FROM fridge_child);

INSERT INTO fridge_partner (partnership_id,
                            indx,
                            person_id,
                            start_date,
                            end_date,
                            created_at,
                            updated,
                            conflict,
                            other_indx)
SELECT partnership_id,
       indx,
       person_id,
       start_date,
       end_date,
       $(updatedAt),
       $(updatedAt),
       conflict,
       other_indx
FROM $(migrationSchema:name).evaka_fridge_partner;

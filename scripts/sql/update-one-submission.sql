-- Update one user's tier list (submission) for kato-2014-holos.
-- Community rankings are derived from placements at read time — no separate table to update.
--
-- 1) Find the submission
SELECT id, display_name, datetime(created_at / 1000, 'unixepoch') AS submitted_at
FROM submissions
WHERE list_id = 'kato-2014-holos'
ORDER BY created_at DESC;

-- 2) Inspect current placements
SELECT item_id, tier
FROM placements
WHERE list_id = 'kato-2014-holos'
  AND submission_id = 'REPLACE_WITH_SUBMISSION_ID'
ORDER BY tier, item_id;

-- 3) Change a single sticker's tier
UPDATE placements
SET tier = 'S'
WHERE list_id = 'kato-2014-holos'
  AND submission_id = 'REPLACE_WITH_SUBMISSION_ID'
  AND item_id = 'titan_holo';

-- 4) Replace the full ranking (all 16 items required)
BEGIN;

UPDATE submissions
SET display_name = 'goodvibes'
WHERE id = 'REPLACE_WITH_SUBMISSION_ID'
  AND list_id = 'kato-2014-holos';

DELETE FROM placements
WHERE submission_id = 'REPLACE_WITH_SUBMISSION_ID'
  AND list_id = 'kato-2014-holos';

INSERT INTO placements (submission_id, list_id, item_id, tier, rank_in_tier) VALUES
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', 'titan_holo', 'S', 0),
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', 'ibuypower_holo', 'S', 0),
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', 'dignitas_holo', 'A', 0),
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', 'reason_holo', 'A', 0),
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', 'fnatic_holo', 'B', 0),
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', 'navi_holo', 'B', 0),
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', 'ldlc_holo', 'C', 0),
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', 'voxeminor_holo', 'C', 0),
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', 'ninjasinpyjamas_holo', 'D', 0),
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', 'hellraisers_holo', 'D', 0),
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', 'mystik_holo', 'E', 0),
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', '3dmax_holo', 'E', 0),
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', 'complexity_holo', 'F', 0),
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', 'mousesports_holo', 'F', 0),
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', 'lgb_holo', 'F', 0),
  ('REPLACE_WITH_SUBMISSION_ID', 'kato-2014-holos', 'virtuspro_holo', 'F', 0);

COMMIT;

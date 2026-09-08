BEGIN;

ALTER TABLE workout_sessions
	ADD COLUMN IF NOT EXISTS session_name VARCHAR;

ALTER TABLE workout_step_logs
	ADD COLUMN IF NOT EXISTS step_type_name VARCHAR,
	ADD COLUMN IF NOT EXISTS exercise_name VARCHAR,
	ADD COLUMN IF NOT EXISTS exercise_variant_name VARCHAR;

CREATE INDEX IF NOT EXISTS programs_user_idx ON programs (user_id, id);

UPDATE workout_sessions ws
SET session_name = s.name
FROM sessions s
WHERE s.id = ws.session_id
	AND ws.session_name IS NULL;

UPDATE workout_step_logs wsl
SET step_type_name = st.name
FROM step_types st
WHERE st.id = wsl.step_type_id
	AND wsl.step_type_name IS NULL;

UPDATE workout_step_logs wsl
SET exercise_name = ex.name,
	exercise_variant_name = ev.name
FROM exercise_variants ev
JOIN exercises ex ON ex.id = ev.exercise_id
WHERE ev.id = wsl.exercise_variant_id
	AND (wsl.exercise_name IS NULL OR wsl.exercise_variant_name IS NULL);

COMMIT;

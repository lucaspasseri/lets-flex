DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS media_generation_candidates CASCADE;
DROP TABLE IF EXISTS entity_media CASCADE;
DROP TABLE IF EXISTS media_asset_alt_texts CASCADE;
DROP TABLE IF EXISTS media_assets CASCADE;
DROP TABLE IF EXISTS guest_creation_limits CASCADE;
DROP TABLE IF EXISTS password_reset_request_limits CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS workout_set_logs CASCADE;
DROP TABLE IF EXISTS workout_step_logs CASCADE;
DROP TABLE IF EXISTS workout_sessions CASCADE;
DROP TABLE IF EXISTS session_steps CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS training_days CASCADE;
DROP TABLE IF EXISTS cycles CASCADE;
DROP TABLE IF EXISTS programs CASCADE;

DROP TABLE IF EXISTS exercise_muscles CASCADE;
DROP TABLE IF EXISTS exercises_muscles CASCADE;
DROP TABLE IF EXISTS movement_pattern_translations CASCADE;
DROP TABLE IF EXISTS equipment_translations CASCADE;
DROP TABLE IF EXISTS muscle_translations CASCADE;
DROP TABLE IF EXISTS exercise_variant_translations CASCADE;
DROP TABLE IF EXISTS exercise_translations CASCADE;
DROP TABLE IF EXISTS exercise_variants CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS movement_patterns CASCADE;
DROP TABLE IF EXISTS muscles CASCADE;
DROP TABLE IF EXISTS muscle_roles CASCADE;
DROP TABLE IF EXISTS equipments CASCADE;
DROP TABLE IF EXISTS step_types CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS auth_identities CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS workout_step_log_status CASCADE;
DROP TYPE IF EXISTS workout_session_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

CREATE TYPE user_role AS ENUM ('user', 'admin', 'guest');

CREATE TABLE users (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	email VARCHAR(254),
	role user_role NOT NULL DEFAULT 'user',
	name VARCHAR(100) NOT NULL,
	date_of_birth DATE,
	anamnesis TEXT,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	guest_expires_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

	CONSTRAINT users_email_normalized CHECK (
		email IS NULL OR email = LOWER(BTRIM(email))
	),
	CONSTRAINT users_profile_by_role CHECK (
		(role IN ('user', 'admin') AND email IS NOT NULL AND guest_expires_at IS NULL)
		OR
		(role = 'guest' AND email IS NULL AND guest_expires_at IS NOT NULL AND date_of_birth IS NULL AND anamnesis IS NULL)
	)
);

CREATE UNIQUE INDEX users_email_unique
ON users (email)
WHERE email IS NOT NULL;

CREATE INDEX users_expired_guests_idx
ON users (guest_expires_at, id)
WHERE role = 'guest';

CREATE TABLE auth_identities (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	provider VARCHAR(50) NOT NULL,
	provider_subject TEXT NOT NULL,
	provider_email VARCHAR(254),
	password_hash TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

	CONSTRAINT auth_identities_provider_normalized CHECK (
		provider = LOWER(BTRIM(provider)) AND provider <> ''
	),
	CONSTRAINT auth_identities_subject_present CHECK (
		provider_subject = BTRIM(provider_subject) AND provider_subject <> ''
	),
	CONSTRAINT auth_identities_local_subject_normalized CHECK (
		provider <> 'local' OR provider_subject = LOWER(provider_subject)
	),
	CONSTRAINT auth_identities_provider_email_normalized CHECK (
		provider_email IS NULL OR provider_email = LOWER(BTRIM(provider_email))
	),
	CONSTRAINT auth_identities_credentials_by_provider CHECK (
		(provider = 'local' AND password_hash IS NOT NULL AND provider_email IS NULL)
		OR (provider <> 'local' AND password_hash IS NULL)
	),
	UNIQUE (provider, provider_subject),
	UNIQUE (user_id, provider)
);

CREATE INDEX auth_identities_user_idx ON auth_identities (user_id);

CREATE TABLE password_reset_tokens (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	auth_identity_id INTEGER NOT NULL REFERENCES auth_identities(id) ON DELETE CASCADE,
	token_hash CHAR(64) NOT NULL UNIQUE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	expires_at TIMESTAMPTZ NOT NULL,
	consumed_at TIMESTAMPTZ,
	CONSTRAINT password_reset_expiration_valid CHECK (expires_at > created_at)
);

CREATE UNIQUE INDEX password_reset_one_active_per_identity
ON password_reset_tokens (auth_identity_id)
WHERE consumed_at IS NULL;

CREATE INDEX password_reset_token_lookup_idx
ON password_reset_tokens (token_hash, expires_at)
WHERE consumed_at IS NULL;

CREATE TABLE goals (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	name VARCHAR NOT NULL
);

CREATE TABLE programs (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
	name VARCHAR,
	start_date DATE DEFAULT CURRENT_DATE,
	provisioning_key VARCHAR(100)
);

CREATE INDEX programs_user_idx ON programs (user_id, id);

CREATE UNIQUE INDEX programs_user_provisioning_key_unique
ON programs (user_id, provisioning_key)
WHERE provisioning_key IS NOT NULL;

CREATE TABLE cycles (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	cycle_size INTEGER NOT NULL DEFAULT 7,
	cycle_order INTEGER NOT NULL,

	UNIQUE (program_id, cycle_order)
);

CREATE TABLE training_days (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	cycle_id INTEGER NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
	day_order INTEGER NOT NULL,
	scheduled_date DATE,
	label VARCHAR(255),

	UNIQUE (cycle_id, day_order)
);

CREATE TABLE step_types (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	name VARCHAR NOT NULL UNIQUE
);

CREATE TABLE movement_patterns (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	catalog_key VARCHAR(100) NOT NULL UNIQUE,
	name VARCHAR NOT NULL UNIQUE,
	notes TEXT,
	CONSTRAINT movement_patterns_catalog_key_format
		CHECK (catalog_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TABLE equipments (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	catalog_key VARCHAR(100) NOT NULL UNIQUE,
	name VARCHAR NOT NULL,
	category VARCHAR,
	CONSTRAINT equipments_catalog_key_format
		CHECK (catalog_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TABLE exercises (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	catalog_key VARCHAR(150),
	name VARCHAR NOT NULL,
	movement_pattern_id INTEGER REFERENCES movement_patterns(id),
	is_archived BOOLEAN NOT NULL DEFAULT FALSE,
	created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT exercises_catalog_key_format
		CHECK (catalog_key IS NULL OR catalog_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX exercises_catalog_key_unique
ON exercises (catalog_key)
WHERE catalog_key IS NOT NULL;

CREATE TABLE exercise_variants (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
	owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
	equipment_id INTEGER REFERENCES equipments(id) ON DELETE SET NULL,
	catalog_key VARCHAR(150),
	name VARCHAR NOT NULL,
	setup_description TEXT,
	environment VARCHAR,
	notes TEXT,
	is_archived BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT exercise_variants_trimmed_name CHECK (name = BTRIM(name) AND name <> ''),
	CONSTRAINT exercise_variants_catalog_key_format
		CHECK (catalog_key IS NULL OR catalog_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX exercise_variants_private_name_unique
ON exercise_variants (exercise_id, owner_user_id, LOWER(name))
WHERE owner_user_id IS NOT NULL;

CREATE UNIQUE INDEX exercise_variants_global_name_unique
ON exercise_variants (exercise_id, LOWER(name))
WHERE owner_user_id IS NULL;

CREATE UNIQUE INDEX exercise_variants_catalog_key_unique
ON exercise_variants (catalog_key)
WHERE catalog_key IS NOT NULL;

CREATE INDEX exercise_variants_owner_idx
ON exercise_variants (owner_user_id, exercise_id);

CREATE TABLE sessions (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
	name VARCHAR NOT NULL,
	notes TEXT,
	is_archived BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX sessions_owner_idx ON sessions (owner_user_id, is_archived);

CREATE TABLE session_steps (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
	step_type_id INTEGER NOT NULL REFERENCES step_types(id),
	exercise_variant_id INTEGER REFERENCES exercise_variants(id) ON DELETE SET NULL,

	name VARCHAR,

	sets INTEGER,
	reps INTEGER,
	load_value FLOAT,
	load_unit VARCHAR,

	step_order INTEGER NOT NULL,

	UNIQUE (session_id, step_order)
);

CREATE TYPE workout_session_status AS ENUM (
	'planned',
	'in_progress',
	'finished',
	'cancelled'
);

CREATE TABLE workout_sessions (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

	training_day_id INTEGER NOT NULL
		REFERENCES training_days(id)
		ON DELETE CASCADE,

	session_id INTEGER NOT NULL
		REFERENCES sessions(id)
		ON DELETE RESTRICT,

	workout_session_order INTEGER NOT NULL,

	started_at TIMESTAMPTZ,
	finished_at TIMESTAMPTZ,

	status workout_session_status NOT NULL DEFAULT 'planned',

	session_name VARCHAR,
	notes TEXT,

	UNIQUE (training_day_id, workout_session_order),

	CHECK (
		(status = 'planned' AND started_at IS NULL AND finished_at IS NULL)
		OR
		(status = 'in_progress' AND started_at IS NOT NULL AND finished_at IS NULL)
		OR
		(status = 'finished' AND started_at IS NOT NULL AND finished_at IS NOT NULL)
		OR
		(status = 'cancelled')
	)
);

CREATE UNIQUE INDEX one_active_workout_session_per_training_day
ON workout_sessions (training_day_id)
WHERE status = 'in_progress';

CREATE TYPE workout_step_log_status AS ENUM (
	'planned',
	'in_progress',
	'performed',
	'skipped'
);

CREATE TABLE workout_step_logs (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

	workout_session_id INTEGER NOT NULL
		REFERENCES workout_sessions(id)
		ON DELETE CASCADE,

	session_step_id INTEGER
		REFERENCES session_steps(id)
		ON DELETE SET NULL,

	status workout_step_log_status NOT NULL DEFAULT 'planned',

	step_order INTEGER NOT NULL,

	step_type_id INTEGER REFERENCES step_types(id),
	exercise_variant_id INTEGER REFERENCES exercise_variants(id) ON DELETE SET NULL,

	name VARCHAR,
	step_type_name VARCHAR,
	exercise_name VARCHAR,
	exercise_variant_name VARCHAR,

	-- Snapshot of the original plan
	planned_sets INTEGER,
	planned_reps INTEGER,
	planned_load_value FLOAT,
	planned_load_unit VARCHAR,

	started_at TIMESTAMPTZ,
	completed_at TIMESTAMPTZ,

	notes TEXT,

	UNIQUE (workout_session_id, step_order),
	UNIQUE (workout_session_id, session_step_id)
);

CREATE TABLE workout_set_logs (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

	workout_step_log_id INTEGER NOT NULL
		REFERENCES workout_step_logs(id)
		ON DELETE CASCADE,

	set_order INTEGER NOT NULL,

	reps INTEGER,
	load_value FLOAT,
	load_unit VARCHAR,

	UNIQUE (workout_step_log_id, set_order)
);

CREATE TABLE muscles (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	catalog_key VARCHAR(100) NOT NULL UNIQUE,
	common_name VARCHAR NOT NULL,
	scientific_name VARCHAR,
	body_region VARCHAR,
	reference_url VARCHAR,
	CONSTRAINT muscles_catalog_key_format
		CHECK (catalog_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TABLE muscle_roles (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	name VARCHAR UNIQUE NOT NULL,
	description TEXT
);

CREATE TABLE exercise_muscles (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

	exercise_id INTEGER NOT NULL
		REFERENCES exercises(id)
		ON DELETE CASCADE,

	muscle_id INTEGER NOT NULL
		REFERENCES muscles(id)
		ON DELETE CASCADE,

	muscle_role_id INTEGER NOT NULL
		REFERENCES muscle_roles(id),

	UNIQUE (exercise_id, muscle_id, muscle_role_id)
);


CREATE TABLE IF NOT EXISTS media_assets (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	storage_key TEXT NOT NULL,
	mime_type VARCHAR(100) NOT NULL,
	width INTEGER NOT NULL,
	height INTEGER NOT NULL,
	source VARCHAR(50) NOT NULL,
	alt_text TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

	CONSTRAINT media_assets_storage_key_present
		CHECK (BTRIM(storage_key) <> ''),
	CONSTRAINT media_assets_mime_type_present
		CHECK (BTRIM(mime_type) <> ''),
	CONSTRAINT media_assets_dimensions_positive
		CHECK (width > 0 AND height > 0),
	CONSTRAINT media_assets_source_present
		CHECK (BTRIM(source) <> ''),
	CONSTRAINT media_assets_alt_text_trimmed
		CHECK (alt_text IS NULL OR alt_text = BTRIM(alt_text)),
	UNIQUE (storage_key)
);

CREATE TABLE IF NOT EXISTS media_asset_alt_texts (
	media_asset_id INTEGER NOT NULL
		REFERENCES media_assets(id)
		ON DELETE CASCADE,
	locale VARCHAR(10) NOT NULL,
	alt_text TEXT NOT NULL,

	PRIMARY KEY (media_asset_id, locale),
	CONSTRAINT media_asset_alt_texts_locale_supported
		CHECK (locale IN ('en', 'pt-BR')),
	CONSTRAINT media_asset_alt_texts_value_trimmed
		CHECK (alt_text = BTRIM(alt_text) AND alt_text <> '')
);

CREATE INDEX IF NOT EXISTS media_asset_alt_texts_locale_idx
	ON media_asset_alt_texts (locale, media_asset_id);

CREATE TABLE IF NOT EXISTS entity_media (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	media_asset_id INTEGER NOT NULL
		REFERENCES media_assets(id)
		ON DELETE RESTRICT,
	entity_type VARCHAR(40) NOT NULL,
	entity_id INTEGER NOT NULL,
	role VARCHAR(20) NOT NULL DEFAULT 'primary',
	sort_order INTEGER NOT NULL DEFAULT 0,
	canonical_path TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

	CONSTRAINT entity_media_entity_type_supported
		CHECK (entity_type IN ('exercise', 'exercise_variant', 'muscle', 'equipment', 'movement_pattern')),
	CONSTRAINT entity_media_entity_id_positive
		CHECK (entity_id > 0),
	CONSTRAINT entity_media_role_supported
		CHECK (role = 'primary'),
	CONSTRAINT entity_media_sort_order_valid
		CHECK (sort_order >= 0),
	CONSTRAINT entity_media_canonical_path_valid
		CHECK (canonical_path IS NULL OR (canonical_path LIKE '/media/%' AND canonical_path NOT LIKE '%..%')),
	UNIQUE (entity_type, entity_id, role)
);

CREATE INDEX IF NOT EXISTS entity_media_lookup_idx
	ON entity_media (entity_type, entity_id, role, sort_order, id);



CREATE TABLE IF NOT EXISTS media_generation_candidates (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	entity_type VARCHAR(40) NOT NULL,
	entity_id INTEGER NOT NULL,
	requested_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	status VARCHAR(20) NOT NULL DEFAULT 'pending_review',
	provider VARCHAR(80) NOT NULL,
	provider_model VARCHAR(120),
	preset VARCHAR(80) NOT NULL,
	prompt_version VARCHAR(40) NOT NULL,
	source VARCHAR(50) NOT NULL DEFAULT 'ai-generation',
	storage_key TEXT NOT NULL UNIQUE,
	mime_type VARCHAR(100) NOT NULL,
	width INTEGER NOT NULL,
	height INTEGER NOT NULL,
	reviewed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
	reviewed_at TIMESTAMPTZ,
	approved_media_asset_id INTEGER REFERENCES media_assets(id) ON DELETE RESTRICT,
	private_file_removed_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

	CONSTRAINT media_generation_candidate_entity_type_supported
		CHECK (entity_type IN ('exercise', 'exercise_variant', 'equipment', 'movement_pattern')),
	CONSTRAINT media_generation_candidate_entity_id_positive CHECK (entity_id > 0),
	CONSTRAINT media_generation_candidate_status_valid
		CHECK (status IN ('pending_review', 'approved', 'rejected')),
	CONSTRAINT media_generation_candidate_source_valid CHECK (source = 'ai-generation'),
	CONSTRAINT media_generation_candidate_storage_key_present CHECK (BTRIM(storage_key) <> ''),
	CONSTRAINT media_generation_candidate_mime_type_present CHECK (BTRIM(mime_type) <> ''),
	CONSTRAINT media_generation_candidate_dimensions_positive CHECK (width > 0 AND height > 0),
	CONSTRAINT media_generation_candidate_review_state_valid CHECK (
		(status = 'pending_review' AND reviewed_at IS NULL AND reviewed_by_user_id IS NULL AND approved_media_asset_id IS NULL)
		OR (status = 'rejected' AND reviewed_at IS NOT NULL AND reviewed_by_user_id IS NOT NULL AND approved_media_asset_id IS NULL)
		OR (status = 'approved' AND reviewed_at IS NOT NULL AND reviewed_by_user_id IS NOT NULL AND approved_media_asset_id IS NOT NULL)
	)
);

CREATE INDEX IF NOT EXISTS media_generation_candidates_target_idx
	ON media_generation_candidates (entity_type, entity_id, status, created_at DESC);



CREATE TABLE IF NOT EXISTS exercise_translations (
	exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
	locale VARCHAR(10) NOT NULL,
	name VARCHAR NOT NULL,

	PRIMARY KEY (exercise_id, locale),
	CONSTRAINT exercise_translations_locale_supported
		CHECK (locale IN ('en', 'pt-BR')),
	CONSTRAINT exercise_translations_name_trimmed
		CHECK (name = BTRIM(name) AND name <> '')
);

CREATE TABLE IF NOT EXISTS exercise_variant_translations (
	exercise_variant_id INTEGER NOT NULL REFERENCES exercise_variants(id) ON DELETE CASCADE,
	locale VARCHAR(10) NOT NULL,
	name VARCHAR NOT NULL,
	setup_description TEXT,

	PRIMARY KEY (exercise_variant_id, locale),
	CONSTRAINT exercise_variant_translations_locale_supported
		CHECK (locale IN ('en', 'pt-BR')),
	CONSTRAINT exercise_variant_translations_name_trimmed
		CHECK (name = BTRIM(name) AND name <> '')
);

CREATE TABLE IF NOT EXISTS muscle_translations (
	muscle_id INTEGER NOT NULL REFERENCES muscles(id) ON DELETE CASCADE,
	locale VARCHAR(10) NOT NULL,
	name VARCHAR NOT NULL,

	PRIMARY KEY (muscle_id, locale),
	CONSTRAINT muscle_translations_locale_supported
		CHECK (locale IN ('en', 'pt-BR')),
	CONSTRAINT muscle_translations_name_trimmed
		CHECK (name = BTRIM(name) AND name <> '')
);

CREATE TABLE IF NOT EXISTS equipment_translations (
	equipment_id INTEGER NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
	locale VARCHAR(10) NOT NULL,
	name VARCHAR NOT NULL,

	PRIMARY KEY (equipment_id, locale),
	CONSTRAINT equipment_translations_locale_supported
		CHECK (locale IN ('en', 'pt-BR')),
	CONSTRAINT equipment_translations_name_trimmed
		CHECK (name = BTRIM(name) AND name <> '')
);

CREATE TABLE IF NOT EXISTS movement_pattern_translations (
	movement_pattern_id INTEGER NOT NULL REFERENCES movement_patterns(id) ON DELETE CASCADE,
	locale VARCHAR(10) NOT NULL,
	name VARCHAR NOT NULL,
	notes TEXT,

	PRIMARY KEY (movement_pattern_id, locale),
	CONSTRAINT movement_pattern_translations_locale_supported
		CHECK (locale IN ('en', 'pt-BR')),
	CONSTRAINT movement_pattern_translations_name_trimmed
		CHECK (name = BTRIM(name) AND name <> '')
);


CREATE TABLE "session" (
	"sid" varchar NOT NULL COLLATE "default",
	"sess" json NOT NULL,
	"expire" timestamp(6) NOT NULL,
	CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX "IDX_session_expire"
ON "session" ("expire");

CREATE TABLE guest_creation_limits (
	key_hash VARCHAR(64) NOT NULL,
	window_started_at TIMESTAMPTZ NOT NULL,
	attempts INTEGER NOT NULL DEFAULT 1,
	PRIMARY KEY (key_hash, window_started_at)
);

CREATE INDEX guest_creation_limits_window_idx
ON guest_creation_limits (window_started_at);

CREATE TABLE password_reset_request_limits (
	key_hash VARCHAR(64) NOT NULL,
	window_started_at TIMESTAMPTZ NOT NULL,
	attempts INTEGER NOT NULL DEFAULT 1,
	PRIMARY KEY (key_hash, window_started_at)
);

CREATE INDEX password_reset_request_limits_window_idx
ON password_reset_request_limits (window_started_at);

INSERT INTO "step_types" ("name")
VALUES
  ('exercise'),
  ('warm_up'),
  ('cardio'),
  ('stretching'),
  ('mobility'),
  ('cooldown');

INSERT INTO "movement_patterns" ("catalog_key", "name")
VALUES
  ('push', 'push'),
  ('pull', 'pull'),
  ('squat', 'squat'),
  ('hinge', 'hinge'),
  ('lunge', 'lunge'),
  ('carry', 'carry'),
  ('rotation', 'rotation'),
  ('gait', 'gait');

INSERT INTO "goals" ("name")
VALUES
  ('hypertrophy'),
  ('strength'),
  ('weight_loss'),
  ('conditioning'),
  ('mobility'),
  ('rehabilitation'),
  ('general_fitness');

INSERT INTO muscles (catalog_key, common_name, scientific_name, body_region, reference_url) VALUES
	('chest', 'Chest', 'Pectoralis Major', 'Upper Body - Anterior', 'https://en.wikipedia.org/wiki/Pectoralis_major'),
	('upper-chest', 'Upper Chest', 'Clavicular Head of Pectoralis Major', 'Upper Body - Anterior', 'https://en.wikipedia.org/wiki/Pectoralis_major'),
	('lower-chest', 'Lower Chest', 'Sternal Head of Pectoralis Major', 'Upper Body - Anterior', 'https://en.wikipedia.org/wiki/Pectoralis_major'),
	('upper-back', 'Upper Back', 'Trapezius', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Trapezius'),
	('lats', 'Lats', 'Latissimus Dorsi', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Latissimus_dorsi'),
	('mid-back', 'Mid Back', 'Rhomboids', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Rhomboid_muscles'),
	('lower-back', 'Lower Back', 'Erector Spinae', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Erector_spinae'),
	('front-delts', 'Front Delts', 'Anterior Deltoid', 'Upper Body - Anterior', 'https://en.wikipedia.org/wiki/Deltoid_muscle'),
	('side-delts', 'Side Delts', 'Lateral Deltoid', 'Upper Body - Lateral', 'https://en.wikipedia.org/wiki/Deltoid_muscle'),
	('rear-delts', 'Rear Delts', 'Posterior Deltoid', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Deltoid_muscle'),
	('biceps', 'Biceps', 'Biceps Brachii', 'Upper Body - Anterior', 'https://en.wikipedia.org/wiki/Biceps'),
	('triceps', 'Triceps', 'Triceps Brachii', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Triceps'),
	('forearms', 'Forearms', 'Forearm Flexors and Extensors', 'Upper Body - Distal', 'https://en.wikipedia.org/wiki/Forearm'),
	('abs', 'Abs', 'Rectus Abdominis', 'Core - Anterior', 'https://en.wikipedia.org/wiki/Rectus_abdominis'),
	('obliques', 'Obliques', 'External Obliques', 'Core - Lateral', 'https://en.wikipedia.org/wiki/Abdominal_oblique_muscles'),
	('deep-core', 'Deep Core', 'Transverse Abdominis', 'Core - Anterior', 'https://en.wikipedia.org/wiki/Transverse_abdominal_muscle'),
	('glutes', 'Glutes', 'Gluteus Maximus', 'Lower Body - Posterior', 'https://en.wikipedia.org/wiki/Gluteus_maximus'),
	('glute-med', 'Glute Med', 'Gluteus Medius', 'Lower Body - Lateral', 'https://en.wikipedia.org/wiki/Gluteus_medius'),
	('quads', 'Quads', 'Quadriceps', 'Lower Body - Anterior', 'https://en.wikipedia.org/wiki/Quadriceps'),
	('hamstrings', 'Hamstrings', 'Hamstrings', 'Lower Body - Posterior', 'https://en.wikipedia.org/wiki/Hamstring'),
	('adductors', 'Adductors', 'Hip Adductors', 'Lower Body - Medial', 'https://en.wikipedia.org/wiki/Adductor_muscles_of_the_hip'),
	('abductors', 'Abductors', 'Hip Abductors', 'Lower Body - Lateral', 'https://en.wikipedia.org/wiki/Hip_abductor'),
	('calves', 'Calves', 'Gastrocnemius', 'Lower Body - Posterior', 'https://en.wikipedia.org/wiki/Gastrocnemius'),
	('soleus', 'Soleus', 'Soleus', 'Lower Body - Posterior', 'https://en.wikipedia.org/wiki/Soleus');

INSERT INTO equipments (catalog_key, name, category) VALUES
  ('barbell', 'Barbell', 'free_weight'),
  ('dumbbell', 'Dumbbell', 'free_weight'),
  ('kettlebell', 'Kettlebell', 'free_weight'),
  ('smith-machine', 'Smith Machine', 'machine'),
  ('cable-machine', 'Cable Machine', 'machine'),
  ('leg-press-machine', 'Leg Press Machine', 'machine'),
  ('chest-press-machine', 'Chest Press Machine', 'machine'),
  ('hack-squat-machine', 'Hack Squat Machine', 'machine'),
  ('leg-extension-machine', 'Leg Extension Machine', 'machine'),
  ('leg-curl-machine', 'Leg Curl Machine', 'machine'),
  ('rear-delt-machine', 'Rear Delt Machine', 'machine'),
  ('lat-pulldown-machine', 'Lat Pulldown Machine', 'machine'),
  ('pull-up-bar', 'Pull-up Bar', 'bodyweight'),
  ('dip-bar', 'Dip Bar', 'bodyweight'),
  ('resistance-band', 'Resistance Band', 'accessory'),
  ('suspension-trainer-trx', 'Suspension Trainer (TRX)', 'accessory'),
  ('ab-wheel', 'Ab Wheel', 'accessory'),
  ('medicine-ball', 'Medicine Ball', 'accessory'),
  ('jump-rope', 'Jump Rope', 'accessory'),
  ('treadmill', 'Treadmill', 'cardio'),
  ('stationary-bike', 'Stationary Bike', 'cardio'),
  ('elliptical-trainer', 'Elliptical Trainer', 'cardio'),
  ('rowing-machine', 'Rowing Machine', 'cardio'),
  ('flat-bench', 'Flat Bench', 'support'),
  ('incline-bench', 'Incline Bench', 'support'),
  ('decline-bench', 'Decline Bench', 'support'),
  ('squat-rack', 'Squat Rack', 'support'),
  ('power-rack', 'Power Rack', 'support');

INSERT INTO "muscle_roles" ("name", "description") VALUES
  ('prime_mover', 'Primary muscle responsible for producing the movement (agonist)'),
  ('synergist', 'Assists the prime mover in performing the movement'),
  ('stabilizer', 'Stabilizes a joint or body segment during movement'),
  ('antagonist', 'Opposes the action of the prime mover'),
  ('fixator', 'Stabilizes the origin of the prime mover'),
  ('dynamic_stabilizer', 'Provides stability while also contributing to movement'),
  ('secondary_mover', 'Contributes to movement but not as dominant as the prime mover');


INSERT INTO exercises (catalog_key, name, movement_pattern_id)
SELECT catalog.catalog_key, catalog.name, movement_patterns.id
FROM (VALUES
('push-up', 'Push Up', 'push'),
('bench-press', 'Bench Press', 'push'),
('overhead-press', 'Overhead Press', 'push'),
('pull-up', 'Pull Up', 'pull'),
('lat-pulldown', 'Lat Pulldown', 'pull'),
('row', 'Row', 'pull'),
('inverted-row', 'Inverted Row', 'pull'),
('squat', 'Squat', 'squat'),
('box-squat', 'Box Squat', 'squat'),
('leg-press', 'Leg Press', 'squat'),
('deadlift', 'Deadlift', 'hinge'),
('romanian-deadlift', 'Romanian Deadlift', 'hinge'),
('hip-extension', 'Hip Extension', 'hinge'),
('forward-lunge', 'Forward Lunge', 'lunge'),
('reverse-lunge', 'Reverse Lunge', 'lunge'),
('split-squat', 'Split Squat', 'lunge'),
('wood-chop', 'Wood Chop', 'rotation'),
('anti-rotation-press', 'Anti-Rotation Press', 'rotation'),
('incline-bench-press', 'Incline Bench Press', 'push'),
('decline-bench-press', 'Decline Bench Press', 'push'),
('chest-fly', 'Chest Fly', 'push'),
('dip', 'Dip', 'push'),
('close-grip-bench-press', 'Close-Grip Bench Press', 'push'),
('chest-supported-row', 'Chest-Supported Row', 'pull'),
('seated-cable-row', 'Seated Cable Row', 'pull'),
('single-arm-lat-pulldown', 'Single-Arm Lat Pulldown', 'pull'),
('straight-arm-pulldown', 'Straight-Arm Pulldown', 'pull'),
('face-pull', 'Face Pull', 'pull'),
('lateral-raise', 'Lateral Raise', 'push'),
('rear-delt-fly', 'Rear Delt Fly', 'pull'),
('biceps-curl', 'Biceps Curl', 'pull'),
('hammer-curl', 'Hammer Curl', 'pull'),
('triceps-pushdown', 'Triceps Pushdown', 'push'),
('overhead-triceps-extension', 'Overhead Triceps Extension', 'push'),
('front-squat', 'Front Squat', 'squat'),
('hack-squat', 'Hack Squat', 'squat'),
('leg-extension', 'Leg Extension', 'squat'),
('leg-curl', 'Leg Curl', 'hinge'),
('good-morning', 'Good Morning', 'hinge'),
('nordic-curl', 'Nordic Curl', 'hinge'),
('step-up', 'Step Up', 'lunge'),
('cable-kickback', 'Cable Kickback', 'hinge'),
('standing-calf-raise', 'Standing Calf Raise', 'hinge'),
('seated-calf-raise', 'Seated Calf Raise', 'hinge'),
('plank', 'Plank', 'carry'),
('dead-bug', 'Dead Bug', 'rotation'),
('hanging-knee-raise', 'Hanging Knee Raise', 'rotation'),
('ab-rollout', 'Ab Rollout', 'rotation'),
('power-clean', 'Power Clean', 'hinge'),
('kettlebell-swing', 'Kettlebell Swing', 'hinge'),
('farmer-carry', 'Farmer Carry', 'carry'),
('push-press', 'Push Press', 'push'),
('dynamic-march', 'Dynamic March', 'gait'),
('jumping-jack', 'Jumping Jack', 'gait'),
('inchworm', 'Inchworm', 'hinge'),
('high-knees', 'High Knees', 'gait'),
('arm-circles', 'Arm Circles', 'push'),
('world-s-greatest-stretch', 'World''s Greatest Stretch', 'lunge'),
('cat-cow', 'Cat-Cow', 'rotation'),
('thoracic-rotation', 'Thoracic Rotation', 'rotation'),
('90-90-hip-switch', '90/90 Hip Switch', 'rotation'),
('ankle-rock', 'Ankle Rock', 'lunge'),
('hamstring-stretch', 'Hamstring Stretch', 'hinge'),
('couch-stretch', 'Couch Stretch', 'lunge'),
('child-s-pose', 'Child''s Pose', 'hinge'),
('shoulder-car', 'Shoulder CAR', 'rotation'),
('cooldown-breathing', 'Cooldown Breathing', 'rotation'),
('running', 'Running', 'gait'),
('walking', 'Walking', 'gait'),
('easy-jog', 'Easy Jog', 'gait'),
('recovery-walk', 'Recovery Walk', 'gait'),
('cycling', 'Cycling', 'gait'),
('jump-rope', 'Jump Rope', 'gait'),
('shuttle-run', 'Shuttle Run', 'gait'),
('elliptical-training', 'Elliptical Training', 'gait'),
('rowing', 'Rowing', 'pull'),
('balance-reach', 'Balance Reach', 'lunge'),
('bear-crawl', 'Bear Crawl', 'carry')
) AS catalog(catalog_key, name, movement_pattern_key)
JOIN movement_patterns ON movement_patterns.catalog_key = catalog.movement_pattern_key;

INSERT INTO exercise_variants (
	exercise_id,
	equipment_id,
	catalog_key,
	name,
	setup_description,
	environment,
	notes
)
SELECT
	exercises.id,
	equipments.id,
	catalog.catalog_key,
	catalog.variant_name,
	catalog.setup_description,
	catalog.environment,
	'Foundational global catalog variant.'
FROM (VALUES
('push-up', 'bodyweight-push-up', 'Bodyweight Push Up', '', 'Hands beneath shoulders with a braced trunk.', 'gym_or_home'),
('push-up', 'resistance-band-push-up', 'Resistance Band Push Up', 'resistance-band', 'Loop a band across the upper back and anchor each end beneath the hands.', 'gym_or_home'),
('bench-press', 'barbell-bench-press', 'Barbell Bench Press', 'barbell', 'Lie on a flat bench with the bar over the mid-chest.', 'gym'),
('bench-press', 'dumbbell-bench-press', 'Dumbbell Bench Press', 'dumbbell', 'Lie on a flat bench with one dumbbell in each hand.', 'gym'),
('overhead-press', 'barbell-overhead-press', 'Barbell Overhead Press', 'barbell', 'Stand with the bar at upper-chest height and brace the trunk.', 'gym'),
('overhead-press', 'dumbbell-overhead-press', 'Dumbbell Overhead Press', 'dumbbell', 'Stand or sit with dumbbells held at shoulder height.', 'gym_or_home'),
('pull-up', 'bodyweight-pull-up', 'Bodyweight Pull Up', 'pull-up-bar', 'Hang from a pull-up bar with a secure overhand grip.', 'gym_or_home'),
('pull-up', 'band-assisted-pull-up', 'Band-Assisted Pull Up', 'resistance-band', 'Secure a band to a pull-up bar and place a foot or knee in the loop.', 'gym_or_home'),
('lat-pulldown', 'machine-lat-pulldown', 'Machine Lat Pulldown', 'lat-pulldown-machine', 'Sit with thighs secured and take an overhand grip on the bar.', 'gym'),
('lat-pulldown', 'resistance-band-lat-pulldown', 'Resistance Band Lat Pulldown', 'resistance-band', 'Anchor the band overhead and kneel or sit beneath the anchor.', 'gym_or_home'),
('row', 'barbell-bent-over-row', 'Barbell Bent-Over Row', 'barbell', 'Hinge to a stable torso angle and hold the bar below the shoulders.', 'gym'),
('row', 'one-arm-dumbbell-row', 'One-Arm Dumbbell Row', 'dumbbell', 'Support one hand on a stable surface and hold the dumbbell below the shoulder.', 'gym_or_home'),
('inverted-row', 'suspension-trainer-inverted-row', 'Suspension Trainer Inverted Row', 'suspension-trainer-trx', 'Set the handles around waist height and lean back with a rigid body.', 'gym_or_home'),
('inverted-row', 'bar-inverted-row', 'Bar Inverted Row', 'power-rack', 'Set a secured bar around waist height and position the chest beneath it.', 'gym'),
('squat', 'barbell-back-squat', 'Barbell Back Squat', 'barbell', 'Barbell supported across the upper back.', 'gym'),
('squat', 'goblet-squat', 'Goblet Squat', 'kettlebell', 'Hold the kettlebell close to the chest and stand with a comfortable stance.', 'gym_or_home'),
('box-squat', 'bodyweight-box-squat', 'Bodyweight Box Squat', '', 'Stand in front of a stable seat set to a comfortable depth.', 'home'),
('box-squat', 'dumbbell-box-squat', 'Dumbbell Box Squat', 'dumbbell', 'Stand in front of a stable box while holding dumbbells at the sides.', 'gym_or_home'),
('leg-press', 'bilateral-leg-press', 'Bilateral Leg Press', 'leg-press-machine', 'Place both feet securely on the platform at a comfortable width.', 'gym'),
('leg-press', 'single-leg-press', 'Single-Leg Press', 'leg-press-machine', 'Place one foot securely on the platform and keep the pelvis supported.', 'gym'),
('deadlift', 'barbell-deadlift', 'Barbell Deadlift', 'barbell', 'Set the bar over the mid-foot and take a balanced grip outside the legs.', 'gym'),
('deadlift', 'kettlebell-deadlift', 'Kettlebell Deadlift', 'kettlebell', 'Place the kettlebell between the feet and hinge to reach the handle.', 'gym_or_home'),
('romanian-deadlift', 'barbell-romanian-deadlift', 'Barbell Romanian Deadlift', 'barbell', 'Hold the bar at hip height and begin from a tall, braced stance.', 'gym'),
('romanian-deadlift', 'dumbbell-romanian-deadlift', 'Dumbbell Romanian Deadlift', 'dumbbell', 'Hold dumbbells in front of the thighs and begin from a tall stance.', 'gym_or_home'),
('hip-extension', 'bodyweight-glute-bridge', 'Bodyweight Glute Bridge', '', 'Lie on the back with knees bent and feet planted near the hips.', 'home'),
('hip-extension', 'barbell-hip-thrust', 'Barbell Hip Thrust', 'barbell', 'Support the upper back on a stable bench and position the padded bar across the hips.', 'gym'),
('forward-lunge', 'bodyweight-forward-lunge', 'Bodyweight Forward Lunge', '', 'Stand tall with clear space to step forward.', 'gym_or_home'),
('forward-lunge', 'dumbbell-forward-lunge', 'Dumbbell Forward Lunge', 'dumbbell', 'Stand tall holding dumbbells at the sides with clear space ahead.', 'gym_or_home'),
('reverse-lunge', 'bodyweight-reverse-lunge', 'Bodyweight Reverse Lunge', '', 'Stand tall with clear space to step backward.', 'gym_or_home'),
('reverse-lunge', 'dumbbell-reverse-lunge', 'Dumbbell Reverse Lunge', 'dumbbell', 'Stand tall holding dumbbells at the sides with clear space behind.', 'gym_or_home'),
('split-squat', 'bodyweight-split-squat', 'Bodyweight Split Squat', '', 'Take a stable staggered stance with both feet remaining planted.', 'gym_or_home'),
('split-squat', 'dumbbell-split-squat', 'Dumbbell Split Squat', 'dumbbell', 'Take a stable staggered stance while holding dumbbells at the sides.', 'gym_or_home'),
('wood-chop', 'cable-wood-chop', 'Cable Wood Chop', 'cable-machine', 'Set the cable above shoulder height and stand side-on to the machine.', 'gym'),
('wood-chop', 'resistance-band-wood-chop', 'Resistance Band Wood Chop', 'resistance-band', 'Anchor the band above shoulder height and stand side-on to the anchor.', 'gym_or_home'),
('anti-rotation-press', 'cable-anti-rotation-press', 'Cable Anti-Rotation Press', 'cable-machine', 'Set the cable at chest height and stand side-on with a stable stance.', 'gym'),
('anti-rotation-press', 'resistance-band-anti-rotation-press', 'Resistance Band Anti-Rotation Press', 'resistance-band', 'Anchor the band at chest height and stand side-on with a stable stance.', 'gym_or_home'),
('incline-bench-press', 'barbell-incline-bench-press', 'Barbell Incline Bench Press', 'barbell', 'Set the bar above the upper chest on an incline bench.', 'gym'),
('incline-bench-press', 'dumbbell-incline-bench-press', 'Dumbbell Incline Bench Press', 'dumbbell', 'Lie on an incline bench with dumbbells aligned over the upper chest.', 'gym'),
('incline-bench-press', 'smith-machine-incline-press', 'Smith Machine Incline Press', 'smith-machine', 'Set the Smith bar over the upper chest on an incline bench.', 'gym'),
('decline-bench-press', 'barbell-decline-bench-press', 'Barbell Decline Bench Press', 'barbell', 'Secure the legs on a decline bench and lower the bar toward the lower chest.', 'gym'),
('decline-bench-press', 'dumbbell-decline-bench-press', 'Dumbbell Decline Bench Press', 'dumbbell', 'Lie on a decline bench with dumbbells over the lower chest.', 'gym'),
('chest-fly', 'cable-chest-fly', 'Cable Chest Fly', 'cable-machine', 'Set both pulleys at chest height and bring the handles together with a soft elbow bend.', 'gym'),
('chest-fly', 'dumbbell-chest-fly', 'Dumbbell Chest Fly', 'dumbbell', 'Lie on a flat bench with dumbbells above the chest and controlled arm arcs.', 'gym'),
('dip', 'bodyweight-dip', 'Bodyweight Dip', 'dip-bar', 'Support the body on parallel bars and lower with the shoulders controlled.', 'gym'),
('dip', 'band-assisted-dip', 'Band-Assisted Dip', 'resistance-band', 'Loop a resistance band over the dip bars to reduce the load during the descent.', 'gym'),
('close-grip-bench-press', 'barbell-close-grip-bench-press', 'Barbell Close-Grip Bench Press', 'barbell', 'Use a narrow, comfortable grip and lower the bar toward the mid-chest.', 'gym'),
('close-grip-bench-press', 'smith-machine-close-grip-press', 'Smith Machine Close-Grip Press', 'smith-machine', 'Set the Smith bar above the mid-chest with a narrow, comfortable grip.', 'gym'),
('chest-supported-row', 'dumbbell-chest-supported-row', 'Dumbbell Chest-Supported Row', 'dumbbell', 'Lie chest-down on an incline bench and row the dumbbells toward the ribs.', 'gym'),
('chest-supported-row', 'machine-chest-supported-row', 'Machine Chest-Supported Row', 'chest-press-machine', 'Set the chest pad and row the handles while keeping the torso supported.', 'gym'),
('seated-cable-row', 'close-grip-seated-cable-row', 'Close-Grip Seated Cable Row', 'cable-machine', 'Sit tall with feet braced and pull the close handle toward the lower ribs.', 'gym'),
('single-arm-lat-pulldown', 'single-arm-cable-lat-pulldown', 'Single-Arm Cable Lat Pulldown', 'cable-machine', 'Kneel or sit beside a high pulley and pull one handle toward the side of the ribs.', 'gym'),
('straight-arm-pulldown', 'cable-straight-arm-pulldown', 'Cable Straight-Arm Pulldown', 'cable-machine', 'Stand facing a high pulley and sweep the straight arms toward the thighs.', 'gym'),
('straight-arm-pulldown', 'band-straight-arm-pulldown', 'Band Straight-Arm Pulldown', 'resistance-band', 'Anchor a band overhead and sweep the straight arms down toward the thighs.', 'gym_or_home'),
('face-pull', 'cable-face-pull', 'Cable Face Pull', 'cable-machine', 'Set the rope at face height and pull toward the forehead with the elbows high.', 'gym'),
('face-pull', 'band-face-pull', 'Band Face Pull', 'resistance-band', 'Anchor a band at face height and pull the handles toward the forehead.', 'gym_or_home'),
('lateral-raise', 'dumbbell-lateral-raise', 'Dumbbell Lateral Raise', 'dumbbell', 'Raise the dumbbells out to the sides with a slight elbow bend and controlled tempo.', 'gym_or_home'),
('lateral-raise', 'cable-lateral-raise', 'Cable Lateral Raise', 'cable-machine', 'Stand side-on to a low pulley and raise one arm through the lateral plane.', 'gym'),
('rear-delt-fly', 'dumbbell-rear-delt-fly', 'Dumbbell Rear Delt Fly', 'dumbbell', 'Hinge or sit supported and open the dumbbells out to shoulder height.', 'gym_or_home'),
('rear-delt-fly', 'machine-rear-delt-fly', 'Machine Rear Delt Fly', 'rear-delt-machine', 'Face the machine pad and open the handles with the rear shoulders.', 'gym'),
('biceps-curl', 'barbell-biceps-curl', 'Barbell Biceps Curl', 'barbell', 'Stand tall and curl the bar without swinging the trunk.', 'gym'),
('hammer-curl', 'dumbbell-hammer-curl', 'Dumbbell Hammer Curl', 'dumbbell', 'Curl the dumbbells with neutral palms and the elbows close to the sides.', 'gym_or_home'),
('triceps-pushdown', 'cable-triceps-pushdown', 'Cable Triceps Pushdown', 'cable-machine', 'Set the cable high and extend the elbows while keeping the upper arms still.', 'gym'),
('triceps-pushdown', 'band-triceps-pushdown', 'Band Triceps Pushdown', 'resistance-band', 'Anchor a band overhead and press the handles down by extending the elbows.', 'gym_or_home'),
('overhead-triceps-extension', 'dumbbell-overhead-triceps-extension', 'Dumbbell Overhead Triceps Extension', 'dumbbell', 'Hold one dumbbell overhead and lower it behind the head with the elbows steady.', 'gym_or_home'),
('overhead-triceps-extension', 'cable-overhead-triceps-extension', 'Cable Overhead Triceps Extension', 'cable-machine', 'Face away from a low pulley and extend the handle overhead.', 'gym'),
('front-squat', 'barbell-front-squat', 'Barbell Front Squat', 'barbell', 'Rest the bar across the front shoulders and squat with an upright torso.', 'gym'),
('front-squat', 'smith-machine-front-squat', 'Smith Machine Front Squat', 'smith-machine', 'Set the Smith bar across the front shoulders and squat along its guided path.', 'gym'),
('hack-squat', 'smith-machine-hack-squat', 'Smith Machine Hack Squat', 'smith-machine', 'Position the feet forward under the Smith bar and squat with the back supported by the setup.', 'gym'),
('hack-squat', 'machine-hack-squat', 'Machine Hack Squat', 'hack-squat-machine', 'Set the shoulders into the machine pads and squat through a controlled range.', 'gym'),
('leg-extension', 'machine-leg-extension', 'Machine Leg Extension', 'leg-extension-machine', 'Adjust the pad above the ankles and extend the knees without lifting the hips.', 'gym'),
('leg-curl', 'lying-leg-curl', 'Lying Leg Curl', 'leg-curl-machine', 'Lie face-down with the pad above the ankles and curl the heels toward the hips.', 'gym'),
('leg-curl', 'seated-leg-curl', 'Seated Leg Curl', 'leg-curl-machine', 'Set the thigh pad and curl the lower legs while keeping the hips supported.', 'gym'),
('good-morning', 'barbell-good-morning', 'Barbell Good Morning', 'barbell', 'Place a light bar across the upper back and hinge with a braced, neutral spine.', 'gym'),
('nordic-curl', 'bodyweight-nordic-curl', 'Bodyweight Nordic Curl', '', 'Anchor the ankles and lower the body slowly from a tall kneeling position.', 'gym_or_home'),
('step-up', 'bodyweight-step-up', 'Bodyweight Step Up', '', 'Step onto a stable platform and stand tall through the working leg.', 'gym_or_home'),
('step-up', 'dumbbell-step-up', 'Dumbbell Step Up', 'dumbbell', 'Step onto a stable platform while holding dumbbells at the sides.', 'gym_or_home'),
('cable-kickback', 'cable-glute-kickback', 'Cable Glute Kickback', 'cable-machine', 'Attach an ankle strap low and extend the leg back without arching the lower back.', 'gym'),
('cable-kickback', 'band-glute-kickback', 'Band Glute Kickback', 'resistance-band', 'Secure a band low and extend one leg back with the pelvis level.', 'gym_or_home'),
('standing-calf-raise', 'barbell-standing-calf-raise', 'Barbell Standing Calf Raise', 'barbell', 'Stand securely with the bar supported and rise through the balls of both feet.', 'gym'),
('standing-calf-raise', 'smith-machine-calf-raise', 'Smith Machine Calf Raise', 'smith-machine', 'Stand under the Smith bar and raise both heels through a controlled range.', 'gym'),
('seated-calf-raise', 'dumbbell-seated-calf-raise', 'Dumbbell Seated Calf Raise', 'dumbbell', 'Sit with a dumbbell across the thigh and raise the heel while keeping the forefoot planted.', 'gym_or_home'),
('plank', 'bodyweight-forearm-plank', 'Bodyweight Forearm Plank', '', 'Support the body on the forearms and toes while keeping the trunk braced.', 'gym_or_home'),
('plank', 'suspension-trainer-plank', 'Suspension Trainer Plank', 'suspension-trainer-trx', 'Place the feet in suspension straps and hold a straight, braced body.', 'gym_or_home'),
('dead-bug', 'bodyweight-dead-bug', 'Bodyweight Dead Bug', '', 'Lie on the back and alternate lowering opposite limbs while keeping the ribs controlled.', 'gym_or_home'),
('dead-bug', 'band-resisted-dead-bug', 'Band-Resisted Dead Bug', 'resistance-band', 'Anchor a band behind the shoulders and move opposite limbs without losing trunk position.', 'gym_or_home'),
('hanging-knee-raise', 'pull-up-bar-hanging-knee-raise', 'Pull-up Bar Hanging Knee Raise', 'pull-up-bar', 'Hang from a secure bar and raise the knees without swinging.', 'gym'),
('ab-rollout', 'ab-wheel-rollout', 'Ab Wheel Rollout', 'ab-wheel', 'Kneel behind the wheel and roll forward only as far as the trunk stays braced.', 'gym_or_home'),
('ab-rollout', 'barbell-rollout', 'Barbell Rollout', 'barbell', 'Kneel behind a lightly loaded barbell and roll forward with controlled trunk tension.', 'gym'),
('power-clean', 'barbell-power-clean', 'Barbell Power Clean', 'barbell', 'Start from the floor and drive the bar upward before receiving it in a partial squat.', 'gym'),
('kettlebell-swing', 'two-hand-kettlebell-swing', 'Two-Hand Kettlebell Swing', 'kettlebell', 'Hike the kettlebell and drive the hips to swing it to chest height.', 'gym_or_home'),
('farmer-carry', 'dumbbell-farmer-carry', 'Dumbbell Farmer Carry', 'dumbbell', 'Walk tall while carrying equal dumbbells with a steady, braced trunk.', 'gym_or_home'),
('farmer-carry', 'kettlebell-farmer-carry', 'Kettlebell Farmer Carry', 'kettlebell', 'Walk tall while carrying kettlebells at the sides with controlled steps.', 'gym_or_home'),
('push-press', 'barbell-push-press', 'Barbell Push Press', 'barbell', 'Dip and drive the bar overhead while keeping the trunk stacked.', 'gym'),
('push-press', 'dumbbell-push-press', 'Dumbbell Push Press', 'dumbbell', 'Use a shallow leg drive to press dumbbells overhead with control.', 'gym_or_home'),
('dynamic-march', 'bodyweight-dynamic-march', 'Bodyweight Dynamic March', '', 'March in place with tall posture and deliberate arm and knee action.', 'gym_or_home'),
('jumping-jack', 'bodyweight-jumping-jack', 'Bodyweight Jumping Jack', '', 'Jump the feet apart and together while lifting and lowering the arms.', 'gym_or_home'),
('inchworm', 'bodyweight-inchworm', 'Bodyweight Inchworm', '', 'Hinge to the floor, walk the hands to a plank, then return to standing.', 'gym_or_home'),
('high-knees', 'bodyweight-high-knees', 'Bodyweight High Knees', '', 'Run in place while lifting the knees comfortably and keeping the trunk tall.', 'gym_or_home'),
('arm-circles', 'bodyweight-arm-circles', 'Bodyweight Arm Circles', '', 'Stand tall and make controlled circles with the arms through a comfortable range.', 'gym_or_home'),
('world-s-greatest-stretch', 'bodyweight-world-s-greatest-stretch', 'Bodyweight World''s Greatest Stretch', '', 'Step into a lunge, rotate toward the forward leg, and move through each side slowly.', 'gym_or_home'),
('cat-cow', 'bodyweight-cat-cow', 'Bodyweight Cat-Cow', '', 'On hands and knees, alternate gentle spinal flexion and extension with the breath.', 'gym_or_home'),
('thoracic-rotation', 'quadruped-thoracic-rotation', 'Quadruped Thoracic Rotation', '', 'From hands and knees, rotate one arm toward the ceiling without shifting the hips.', 'gym_or_home'),
('90-90-hip-switch', 'bodyweight-90-90-hip-switch', 'Bodyweight 90/90 Hip Switch', '', 'Sit with both knees bent and rotate between sides while keeping the movement controlled.', 'gym_or_home'),
('ankle-rock', 'bodyweight-ankle-rock', 'Bodyweight Ankle Rock', '', 'With the foot planted, glide the knee forward over the toes without lifting the heel.', 'gym_or_home'),
('hamstring-stretch', 'standing-hamstring-stretch', 'Standing Hamstring Stretch', '', 'Place one heel forward and hinge gently until a comfortable hamstring stretch is felt.', 'gym_or_home'),
('couch-stretch', 'bodyweight-couch-stretch', 'Bodyweight Couch Stretch', '', 'Place the shin near a wall or couch and settle into a controlled half-kneeling stretch.', 'home'),
('child-s-pose', 'bodyweight-child-s-pose', 'Bodyweight Child''s Pose', '', 'Sit the hips toward the heels and reach the arms forward while breathing comfortably.', 'gym_or_home'),
('shoulder-car', 'bodyweight-shoulder-car', 'Bodyweight Shoulder CAR', '', 'Move one arm slowly through its largest comfortable circle while keeping the ribs controlled.', 'gym_or_home'),
('cooldown-breathing', 'bodyweight-cooldown-breathing', 'Bodyweight Cooldown Breathing', '', 'Settle into a comfortable position and use slow, relaxed breaths to bring the session down gradually.', 'gym_or_home'),
('running', 'outdoor-running', 'Outdoor Running', '', 'Run on a clear outdoor route at a pace suited to the session.', 'outdoors'),
('running', 'treadmill-running', 'Treadmill Running', 'treadmill', 'Run on a treadmill with a gradual warm-up and a pace suited to the session.', 'treadmill'),
('running', 'track-running', 'Track Running', '', 'Run on a marked track and adjust pace or laps to the session goal.', 'track'),
('running', 'beach-running', 'Beach Running', '', 'Run on a safe, firm section of beach and adjust pace for the surface.', 'beach'),
('walking', 'outdoor-walking', 'Outdoor Walking', '', 'Walk outdoors at a comfortable, steady pace.', 'outdoors'),
('walking', 'treadmill-walking', 'Treadmill Walking', 'treadmill', 'Walk on a treadmill at a pace that allows controlled posture.', 'treadmill'),
('walking', 'incline-treadmill-walking', 'Incline Treadmill Walking', 'treadmill', 'Walk on a treadmill with a moderate incline and controlled, even steps.', 'treadmill'),
('easy-jog', 'outdoor-easy-jog', 'Outdoor Easy Jog', '', 'Jog outdoors at an easy conversational pace.', 'outdoors'),
('easy-jog', 'track-easy-jog', 'Track Easy Jog', '', 'Jog on a track at an easy conversational pace.', 'track'),
('recovery-walk', 'outdoor-recovery-walk', 'Outdoor Recovery Walk', '', 'Walk outdoors at an easy pace that supports active recovery.', 'outdoors'),
('recovery-walk', 'treadmill-recovery-walk', 'Treadmill Recovery Walk', 'treadmill', 'Walk on a treadmill at an easy pace with relaxed, controlled steps.', 'treadmill'),
('cycling', 'stationary-bike-cycling', 'Stationary Bike Cycling', 'stationary-bike', 'Adjust the saddle and pedal smoothly at a sustainable effort.', 'gym'),
('cycling', 'outdoor-cycling', 'Outdoor Cycling', '', 'Cycle on a clear outdoor route with a sustainable effort.', 'outdoors'),
('jump-rope', 'jump-rope', 'Jump Rope', 'jump-rope', 'Use small, elastic hops and turn the rope at a steady rhythm.', 'gym_or_home'),
('shuttle-run', 'track-shuttle-run', 'Track Shuttle Run', '', 'Run between marked points on a track with controlled turns.', 'track'),
('shuttle-run', 'outdoor-shuttle-run', 'Outdoor Shuttle Run', '', 'Run between safe outdoor markers with controlled accelerations and turns.', 'outdoors'),
('elliptical-training', 'machine-elliptical-training', 'Machine Elliptical Training', 'elliptical-trainer', 'Set a sustainable resistance and move smoothly through the elliptical stride.', 'gym'),
('rowing', 'indoor-rowing-machine', 'Indoor Rowing Machine', 'rowing-machine', 'Drive with the legs, then open the hips and finish with the arms on each stroke.', 'gym'),
('balance-reach', 'single-leg-balance-reach', 'Single-Leg Balance Reach', '', 'Balance on one leg and reach the free leg or hands while keeping the pelvis level.', 'gym_or_home'),
('bear-crawl', 'bodyweight-bear-crawl', 'Bodyweight Bear Crawl', '', 'Move on hands and feet with the knees hovering low and the trunk steady.', 'gym_or_home')
) AS catalog(exercise_key, catalog_key, variant_name, equipment_key, setup_description, environment)
JOIN exercises ON exercises.catalog_key = catalog.exercise_key
LEFT JOIN equipments
	ON equipments.catalog_key = NULLIF(catalog.equipment_key, '');

INSERT INTO exercise_muscles (exercise_id, muscle_id, muscle_role_id)
SELECT exercises.id, muscles.id, muscle_roles.id
FROM (VALUES
('push-up', 'chest', 'prime_mover'),
('bench-press', 'chest', 'prime_mover'),
('overhead-press', 'front-delts', 'prime_mover'),
('pull-up', 'lats', 'prime_mover'),
('lat-pulldown', 'lats', 'prime_mover'),
('row', 'mid-back', 'prime_mover'),
('inverted-row', 'mid-back', 'prime_mover'),
('squat', 'quads', 'prime_mover'),
('box-squat', 'quads', 'prime_mover'),
('leg-press', 'quads', 'prime_mover'),
('deadlift', 'glutes', 'prime_mover'),
('romanian-deadlift', 'hamstrings', 'prime_mover'),
('hip-extension', 'glutes', 'prime_mover'),
('forward-lunge', 'quads', 'prime_mover'),
('reverse-lunge', 'glutes', 'prime_mover'),
('split-squat', 'quads', 'prime_mover'),
('wood-chop', 'obliques', 'prime_mover'),
('anti-rotation-press', 'obliques', 'prime_mover'),
('incline-bench-press', 'upper-chest', 'prime_mover'),
('decline-bench-press', 'lower-chest', 'prime_mover'),
('chest-fly', 'chest', 'prime_mover'),
('dip', 'triceps', 'prime_mover'),
('close-grip-bench-press', 'triceps', 'prime_mover'),
('chest-supported-row', 'mid-back', 'prime_mover'),
('seated-cable-row', 'mid-back', 'prime_mover'),
('single-arm-lat-pulldown', 'lats', 'prime_mover'),
('straight-arm-pulldown', 'lats', 'prime_mover'),
('face-pull', 'rear-delts', 'prime_mover'),
('lateral-raise', 'side-delts', 'prime_mover'),
('rear-delt-fly', 'rear-delts', 'prime_mover'),
('biceps-curl', 'biceps', 'prime_mover'),
('hammer-curl', 'biceps', 'prime_mover'),
('triceps-pushdown', 'triceps', 'prime_mover'),
('overhead-triceps-extension', 'triceps', 'prime_mover'),
('front-squat', 'quads', 'prime_mover'),
('hack-squat', 'quads', 'prime_mover'),
('leg-extension', 'quads', 'prime_mover'),
('leg-curl', 'hamstrings', 'prime_mover'),
('good-morning', 'hamstrings', 'prime_mover'),
('nordic-curl', 'hamstrings', 'prime_mover'),
('step-up', 'glutes', 'prime_mover'),
('cable-kickback', 'glutes', 'prime_mover'),
('standing-calf-raise', 'calves', 'prime_mover'),
('seated-calf-raise', 'soleus', 'prime_mover'),
('plank', 'deep-core', 'prime_mover'),
('dead-bug', 'deep-core', 'prime_mover'),
('hanging-knee-raise', 'abs', 'prime_mover'),
('ab-rollout', 'abs', 'prime_mover'),
('power-clean', 'glutes', 'prime_mover'),
('kettlebell-swing', 'glutes', 'prime_mover'),
('farmer-carry', 'forearms', 'prime_mover'),
('push-press', 'front-delts', 'prime_mover'),
('dynamic-march', 'deep-core', 'prime_mover'),
('jumping-jack', 'calves', 'prime_mover'),
('inchworm', 'hamstrings', 'prime_mover'),
('high-knees', 'quads', 'prime_mover'),
('arm-circles', 'front-delts', 'prime_mover'),
('world-s-greatest-stretch', 'glute-med', 'prime_mover'),
('cat-cow', 'lower-back', 'prime_mover'),
('thoracic-rotation', 'upper-back', 'prime_mover'),
('90-90-hip-switch', 'glute-med', 'prime_mover'),
('ankle-rock', 'calves', 'prime_mover'),
('hamstring-stretch', 'hamstrings', 'prime_mover'),
('couch-stretch', 'quads', 'prime_mover'),
('child-s-pose', 'lower-back', 'prime_mover'),
('shoulder-car', 'front-delts', 'prime_mover'),
('cooldown-breathing', 'deep-core', 'prime_mover'),
('running', 'calves', 'prime_mover'),
('walking', 'calves', 'prime_mover'),
('easy-jog', 'calves', 'prime_mover'),
('recovery-walk', 'calves', 'prime_mover'),
('cycling', 'quads', 'prime_mover'),
('jump-rope', 'calves', 'prime_mover'),
('shuttle-run', 'quads', 'prime_mover'),
('elliptical-training', 'quads', 'prime_mover'),
('rowing', 'quads', 'prime_mover'),
('balance-reach', 'glute-med', 'prime_mover'),
('bear-crawl', 'deep-core', 'prime_mover')
) AS catalog(exercise_key, muscle_key, muscle_role_name)
JOIN exercises ON exercises.catalog_key = catalog.exercise_key
JOIN muscles ON muscles.catalog_key = catalog.muscle_key
JOIN muscle_roles ON muscle_roles.name = catalog.muscle_role_name;


INSERT INTO exercise_translations (exercise_id, locale, name)
SELECT id, 'en', name
FROM exercises
ON CONFLICT (exercise_id, locale) DO NOTHING;

INSERT INTO exercise_variant_translations (
	exercise_variant_id,
	locale,
	name,
	setup_description
)
SELECT id, 'en', name, setup_description
FROM exercise_variants
WHERE owner_user_id IS NULL
ON CONFLICT (exercise_variant_id, locale) DO NOTHING;

INSERT INTO muscle_translations (muscle_id, locale, name)
SELECT id, 'en', common_name
FROM muscles
ON CONFLICT (muscle_id, locale) DO NOTHING;

INSERT INTO equipment_translations (equipment_id, locale, name)
SELECT id, 'en', name
FROM equipments
ON CONFLICT (equipment_id, locale) DO NOTHING;

INSERT INTO movement_pattern_translations (movement_pattern_id, locale, name, notes)
SELECT id, 'en', name, notes
FROM movement_patterns
ON CONFLICT (movement_pattern_id, locale) DO NOTHING;


INSERT INTO exercise_translations (exercise_id, locale, name)
SELECT exercises.id, 'pt-BR', translations.name
FROM (VALUES
('push-up', 'Flexão de braço'),
('bench-press', 'Supino reto'),
('overhead-press', 'Desenvolvimento'),
('pull-up', 'Barra fixa'),
('lat-pulldown', 'Puxada na frente'),
('row', 'Remada'),
('inverted-row', 'Remada invertida'),
('squat', 'Agachamento'),
('box-squat', 'Agachamento no caixote'),
('leg-press', 'Leg press'),
('deadlift', 'Levantamento terra'),
('romanian-deadlift', 'Levantamento terra romeno'),
('hip-extension', 'Extensão de quadril'),
('forward-lunge', 'Afundo à frente'),
('reverse-lunge', 'Afundo reverso'),
('split-squat', 'Agachamento dividido'),
('wood-chop', 'Lenhador'),
('anti-rotation-press', 'Pressão anti-rotação'),
('incline-bench-press', 'Supino inclinado'),
('decline-bench-press', 'Supino declinado'),
('chest-fly', 'Crucifixo'),
('dip', 'Mergulho'),
('close-grip-bench-press', 'Supino fechado'),
('chest-supported-row', 'Remada com apoio no peito'),
('seated-cable-row', 'Remada sentada na polia'),
('single-arm-lat-pulldown', 'Puxada unilateral'),
('straight-arm-pulldown', 'Puxada com braços estendidos'),
('face-pull', 'Face pull'),
('lateral-raise', 'Elevação lateral'),
('rear-delt-fly', 'Crucifixo inverso'),
('biceps-curl', 'Rosca bíceps'),
('hammer-curl', 'Rosca martelo'),
('triceps-pushdown', 'Tríceps na polia'),
('overhead-triceps-extension', 'Extensão de tríceps acima da cabeça'),
('front-squat', 'Agachamento frontal'),
('hack-squat', 'Agachamento hack'),
('leg-extension', 'Cadeira extensora'),
('leg-curl', 'Mesa flexora'),
('good-morning', 'Good morning'),
('nordic-curl', 'Flexão nórdica'),
('step-up', 'Subida no caixote'),
('cable-kickback', 'Coice na polia'),
('standing-calf-raise', 'Elevação de panturrilha em pé'),
('seated-calf-raise', 'Elevação de panturrilha sentado'),
('plank', 'Prancha'),
('dead-bug', 'Dead bug'),
('hanging-knee-raise', 'Elevação de joelhos suspenso'),
('ab-rollout', 'Rolamento abdominal'),
('power-clean', 'Power clean'),
('kettlebell-swing', 'Balanço com kettlebell'),
('farmer-carry', 'Caminhada do fazendeiro'),
('push-press', 'Push press'),
('dynamic-march', 'Marcha dinâmica'),
('jumping-jack', 'Polichinelo'),
('inchworm', 'Minhoca'),
('high-knees', 'Joelhos altos'),
('arm-circles', 'Círculos com os braços'),
('world-s-greatest-stretch', 'Maior alongamento do mundo'),
('cat-cow', 'Gato-vaca'),
('thoracic-rotation', 'Rotação torácica'),
('90-90-hip-switch', 'Alternância de quadril 90/90'),
('ankle-rock', 'Balanço de tornozelo'),
('hamstring-stretch', 'Alongamento dos posteriores de coxa'),
('couch-stretch', 'Alongamento no sofá'),
('child-s-pose', 'Postura da criança'),
('shoulder-car', 'CAR do ombro'),
('cooldown-breathing', 'Respiração de volta à calma'),
('running', 'Corrida'),
('walking', 'Caminhada'),
('easy-jog', 'Trote leve'),
('recovery-walk', 'Caminhada de recuperação'),
('cycling', 'Ciclismo'),
('jump-rope', 'Pular corda'),
('shuttle-run', 'Corrida de ida e volta'),
('elliptical-training', 'Treino no elíptico'),
('rowing', 'Remo'),
('balance-reach', 'Alcance em apoio unipodal'),
('bear-crawl', 'Engatinhar do urso')
) AS translations(catalog_key, name)
JOIN exercises ON exercises.catalog_key = translations.catalog_key
ON CONFLICT (exercise_id, locale) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO exercise_variant_translations (exercise_variant_id, locale, name)
SELECT exercise_variants.id, 'pt-BR', translations.name
FROM (VALUES
('bodyweight-push-up', 'Flexão de braço com peso corporal'),
('resistance-band-push-up', 'Flexão de braço com faixa elástica'),
('barbell-bench-press', 'Supino reto com barra'),
('dumbbell-bench-press', 'Supino reto com halteres'),
('barbell-overhead-press', 'Desenvolvimento com barra'),
('dumbbell-overhead-press', 'Desenvolvimento com halteres'),
('bodyweight-pull-up', 'Barra fixa com peso corporal'),
('band-assisted-pull-up', 'Barra fixa assistida com faixa elástica'),
('machine-lat-pulldown', 'Puxada na máquina'),
('resistance-band-lat-pulldown', 'Puxada com faixa elástica'),
('barbell-bent-over-row', 'Remada curvada com barra'),
('one-arm-dumbbell-row', 'Remada unilateral com halter'),
('suspension-trainer-inverted-row', 'Remada invertida no TRX'),
('bar-inverted-row', 'Remada invertida com barra'),
('barbell-back-squat', 'Agachamento livre com barra'),
('goblet-squat', 'Agachamento goblet'),
('bodyweight-box-squat', 'Agachamento no caixote com peso corporal'),
('dumbbell-box-squat', 'Agachamento no caixote com halteres'),
('bilateral-leg-press', 'Leg press bilateral'),
('single-leg-press', 'Leg press unilateral'),
('barbell-deadlift', 'Levantamento terra com barra'),
('kettlebell-deadlift', 'Levantamento terra com kettlebell'),
('barbell-romanian-deadlift', 'Levantamento terra romeno com barra'),
('dumbbell-romanian-deadlift', 'Levantamento terra romeno com halteres'),
('bodyweight-glute-bridge', 'Ponte de glúteos com peso corporal'),
('barbell-hip-thrust', 'Elevação pélvica com barra'),
('bodyweight-forward-lunge', 'Afundo à frente com peso corporal'),
('dumbbell-forward-lunge', 'Afundo à frente com halteres'),
('bodyweight-reverse-lunge', 'Afundo reverso com peso corporal'),
('dumbbell-reverse-lunge', 'Afundo reverso com halteres'),
('bodyweight-split-squat', 'Agachamento dividido com peso corporal'),
('dumbbell-split-squat', 'Agachamento dividido com halteres'),
('cable-wood-chop', 'Lenhador na polia'),
('resistance-band-wood-chop', 'Lenhador com faixa elástica'),
('cable-anti-rotation-press', 'Pressão anti-rotação na polia'),
('resistance-band-anti-rotation-press', 'Pressão anti-rotação com faixa elástica'),
('barbell-incline-bench-press', 'Supino inclinado com barra'),
('dumbbell-incline-bench-press', 'Supino inclinado com halteres'),
('smith-machine-incline-press', 'Supino inclinado no Smith'),
('barbell-decline-bench-press', 'Supino declinado com barra'),
('dumbbell-decline-bench-press', 'Supino declinado com halteres'),
('cable-chest-fly', 'Crucifixo na polia'),
('dumbbell-chest-fly', 'Crucifixo com halteres'),
('bodyweight-dip', 'Mergulho com peso corporal'),
('band-assisted-dip', 'Mergulho assistido com faixa elástica'),
('barbell-close-grip-bench-press', 'Supino fechado com barra'),
('smith-machine-close-grip-press', 'Supino fechado no Smith'),
('dumbbell-chest-supported-row', 'Remada com apoio no peito e halteres'),
('machine-chest-supported-row', 'Remada com apoio no peito na máquina'),
('close-grip-seated-cable-row', 'Remada sentada fechada na polia'),
('single-arm-cable-lat-pulldown', 'Puxada unilateral na polia'),
('cable-straight-arm-pulldown', 'Puxada com braços estendidos na polia'),
('band-straight-arm-pulldown', 'Puxada com braços estendidos e faixa elástica'),
('cable-face-pull', 'Face pull na polia'),
('band-face-pull', 'Face pull com faixa elástica'),
('dumbbell-lateral-raise', 'Elevação lateral com halteres'),
('cable-lateral-raise', 'Elevação lateral na polia'),
('dumbbell-rear-delt-fly', 'Crucifixo inverso com halteres'),
('machine-rear-delt-fly', 'Crucifixo inverso na máquina'),
('barbell-biceps-curl', 'Rosca bíceps com barra'),
('dumbbell-hammer-curl', 'Rosca martelo com halteres'),
('cable-triceps-pushdown', 'Tríceps na polia'),
('band-triceps-pushdown', 'Tríceps com faixa elástica'),
('dumbbell-overhead-triceps-extension', 'Extensão de tríceps acima da cabeça com halter'),
('cable-overhead-triceps-extension', 'Extensão de tríceps acima da cabeça na polia'),
('barbell-front-squat', 'Agachamento frontal com barra'),
('smith-machine-front-squat', 'Agachamento frontal no Smith'),
('smith-machine-hack-squat', 'Agachamento hack no Smith'),
('machine-hack-squat', 'Agachamento hack na máquina'),
('machine-leg-extension', 'Cadeira extensora'),
('lying-leg-curl', 'Mesa flexora deitada'),
('seated-leg-curl', 'Mesa flexora sentada'),
('barbell-good-morning', 'Good morning com barra'),
('bodyweight-nordic-curl', 'Flexão nórdica com peso corporal'),
('bodyweight-step-up', 'Subida no caixote com peso corporal'),
('dumbbell-step-up', 'Subida no caixote com halteres'),
('cable-glute-kickback', 'Coice de glúteos na polia'),
('band-glute-kickback', 'Coice de glúteos com faixa elástica'),
('barbell-standing-calf-raise', 'Elevação de panturrilha em pé com barra'),
('smith-machine-calf-raise', 'Elevação de panturrilha em pé no Smith'),
('dumbbell-seated-calf-raise', 'Elevação de panturrilha sentado com halteres'),
('bodyweight-forearm-plank', 'Prancha de antebraços com peso corporal'),
('suspension-trainer-plank', 'Prancha no TRX'),
('bodyweight-dead-bug', 'Dead bug com peso corporal'),
('band-resisted-dead-bug', 'Dead bug resistido com faixa elástica'),
('pull-up-bar-hanging-knee-raise', 'Elevação de joelhos suspenso na barra fixa'),
('ab-wheel-rollout', 'Rolamento abdominal com roda'),
('barbell-rollout', 'Rolamento abdominal com barra'),
('barbell-power-clean', 'Power clean com barra'),
('two-hand-kettlebell-swing', 'Balanço com kettlebell usando as duas mãos'),
('dumbbell-farmer-carry', 'Caminhada do fazendeiro com halteres'),
('kettlebell-farmer-carry', 'Caminhada do fazendeiro com kettlebell'),
('barbell-push-press', 'Push press com barra'),
('dumbbell-push-press', 'Push press com halteres'),
('bodyweight-dynamic-march', 'Marcha dinâmica com peso corporal'),
('bodyweight-jumping-jack', 'Polichinelo com peso corporal'),
('bodyweight-inchworm', 'Minhoca com peso corporal'),
('bodyweight-high-knees', 'Joelhos altos com peso corporal'),
('bodyweight-arm-circles', 'Círculos com os braços'),
('bodyweight-world-s-greatest-stretch', 'Maior alongamento do mundo com peso corporal'),
('bodyweight-cat-cow', 'Gato-vaca com peso corporal'),
('quadruped-thoracic-rotation', 'Rotação torácica em quatro apoios'),
('bodyweight-90-90-hip-switch', 'Alternância de quadril 90/90 com peso corporal'),
('bodyweight-ankle-rock', 'Balanço de tornozelo com peso corporal'),
('standing-hamstring-stretch', 'Alongamento dos posteriores de coxa em pé'),
('bodyweight-couch-stretch', 'Alongamento no sofá com peso corporal'),
('bodyweight-child-s-pose', 'Postura da criança com peso corporal'),
('bodyweight-shoulder-car', 'CAR do ombro com peso corporal'),
('bodyweight-cooldown-breathing', 'Respiração de volta à calma'),
('outdoor-running', 'Corrida ao ar livre'),
('treadmill-running', 'Corrida na esteira'),
('track-running', 'Corrida na pista'),
('beach-running', 'Corrida na praia'),
('outdoor-walking', 'Caminhada ao ar livre'),
('treadmill-walking', 'Caminhada na esteira'),
('incline-treadmill-walking', 'Caminhada inclinada na esteira'),
('outdoor-easy-jog', 'Trote leve ao ar livre'),
('track-easy-jog', 'Trote leve na pista'),
('outdoor-recovery-walk', 'Caminhada de recuperação ao ar livre'),
('treadmill-recovery-walk', 'Caminhada de recuperação na esteira'),
('stationary-bike-cycling', 'Ciclismo na bicicleta ergométrica'),
('outdoor-cycling', 'Ciclismo ao ar livre'),
('jump-rope', 'Pular corda'),
('track-shuttle-run', 'Corrida de ida e volta na pista'),
('outdoor-shuttle-run', 'Corrida de ida e volta ao ar livre'),
('machine-elliptical-training', 'Treino no elíptico'),
('indoor-rowing-machine', 'Remo na máquina indoor'),
('single-leg-balance-reach', 'Alcance em apoio unipodal'),
('bodyweight-bear-crawl', 'Engatinhar do urso com peso corporal')
) AS translations(catalog_key, name)
JOIN exercise_variants
	ON exercise_variants.catalog_key = translations.catalog_key
	AND exercise_variants.owner_user_id IS NULL
ON CONFLICT (exercise_variant_id, locale) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO muscle_translations (muscle_id, locale, name)
SELECT muscles.id, 'pt-BR', translations.name
FROM (VALUES
('chest', 'Peito'),
('upper-chest', 'Peito superior'),
('lower-chest', 'Peito inferior'),
('upper-back', 'Parte superior das costas'),
('lats', 'Grande dorsal'),
('mid-back', 'Parte média das costas'),
('lower-back', 'Lombar'),
('front-delts', 'Deltoides anteriores'),
('side-delts', 'Deltoides laterais'),
('rear-delts', 'Deltoides posteriores'),
('biceps', 'Bíceps'),
('triceps', 'Tríceps'),
('forearms', 'Antebraços'),
('abs', 'Abdômen'),
('obliques', 'Oblíquos'),
('deep-core', 'Core profundo'),
('glutes', 'Glúteos'),
('glute-med', 'Glúteo médio'),
('quads', 'Quadríceps'),
('hamstrings', 'Isquiotibiais'),
('adductors', 'Adutores'),
('abductors', 'Abdutores'),
('calves', 'Panturrilhas'),
('soleus', 'Sóleo')
) AS translations(catalog_key, name)
JOIN muscles ON muscles.catalog_key = translations.catalog_key
ON CONFLICT (muscle_id, locale) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO equipment_translations (equipment_id, locale, name)
SELECT equipments.id, 'pt-BR', translations.name
FROM (VALUES
('barbell', 'Barra'),
('dumbbell', 'Halteres'),
('kettlebell', 'Kettlebell'),
('smith-machine', 'Máquina Smith'),
('cable-machine', 'Polia'),
('leg-press-machine', 'Máquina de leg press'),
('chest-press-machine', 'Máquina de supino'),
('hack-squat-machine', 'Máquina de agachamento hack'),
('leg-extension-machine', 'Cadeira extensora'),
('leg-curl-machine', 'Mesa flexora'),
('rear-delt-machine', 'Máquina para deltoide posterior'),
('lat-pulldown-machine', 'Máquina de puxada'),
('pull-up-bar', 'Barra fixa'),
('dip-bar', 'Barras paralelas'),
('resistance-band', 'Faixa elástica'),
('suspension-trainer-trx', 'Treinador de suspensão (TRX)'),
('ab-wheel', 'Roda abdominal'),
('medicine-ball', 'Bola medicinal'),
('jump-rope', 'Corda de pular'),
('treadmill', 'Esteira'),
('stationary-bike', 'Bicicleta ergométrica'),
('elliptical-trainer', 'Elíptico'),
('rowing-machine', 'Máquina de remo'),
('flat-bench', 'Banco reto'),
('incline-bench', 'Banco inclinado'),
('decline-bench', 'Banco declinado'),
('squat-rack', 'Rack de agachamento'),
('power-rack', 'Power rack')
) AS translations(catalog_key, name)
JOIN equipments ON equipments.catalog_key = translations.catalog_key
ON CONFLICT (equipment_id, locale) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO movement_pattern_translations (movement_pattern_id, locale, name)
SELECT movement_patterns.id, 'pt-BR', translations.name
FROM (VALUES
('push', 'Empurrar'),
('pull', 'Puxar'),
('squat', 'Agachamento'),
('hinge', 'Dobradiça de quadril'),
('lunge', 'Afundo'),
('carry', 'Carregar'),
('rotation', 'Rotação'),
('gait', 'Locomoção')
) AS translations(catalog_key, name)
JOIN movement_patterns ON movement_patterns.catalog_key = translations.catalog_key
ON CONFLICT (movement_pattern_id, locale) DO UPDATE SET name = EXCLUDED.name;



INSERT INTO sessions (name, notes)
VALUES ('Sample Full Body Session', 'A short, read-only full-body session for learning the workout flow.');

INSERT INTO session_steps (
	session_id, step_type_id, exercise_variant_id, name, sets, reps, step_order
)
SELECT
	session.id,
	step_type.id,
	variant.id,
	starter.name,
	starter.sets,
	starter.reps,
	starter.step_order
FROM (VALUES
('bodyweight-box-squat', 'Box squats', 3, 10, 1),
('bodyweight-push-up', 'Push ups', 3, 10, 2),
('one-arm-dumbbell-row', 'One-arm rows', 3, 10, 3),
('bodyweight-glute-bridge', 'Glute bridges', 3, 12, 4)
) AS starter(variant_catalog_key, name, sets, reps, step_order)
JOIN sessions AS session
	ON session.name = 'Sample Full Body Session'
	AND session.owner_user_id IS NULL
	AND session.is_archived = FALSE
JOIN step_types AS step_type ON step_type.name = 'exercise'
JOIN exercise_variants AS variant
	ON variant.catalog_key = starter.variant_catalog_key
	AND variant.owner_user_id IS NULL
	AND variant.is_archived = FALSE;


DO $$
DECLARE missing_references TEXT;
BEGIN
	SELECT string_agg(
		reference.entity_type || ':' || reference.catalog_key,
		', ' ORDER BY reference.entity_type, reference.catalog_key
	)
	INTO missing_references
	FROM (VALUES
('exercise_variant', 'barbell-bench-press', 'exercise_variants'),
('muscle', 'chest', 'muscles'),
('exercise', 'bench-press', 'exercises'),
('exercise', 'push-up', 'exercises'),
('exercise', 'row', 'exercises'),
('exercise', 'leg-press', 'exercises'),
('exercise_variant', 'goblet-squat', 'exercise_variants'),
('exercise', 'hip-extension', 'exercises'),
('exercise', 'running', 'exercises'),
('equipment', 'barbell', 'equipments'),
('equipment', 'dumbbell', 'equipments'),
('equipment', 'kettlebell', 'equipments'),
('equipment', 'resistance-band', 'equipments'),
('movement_pattern', 'push', 'movement_patterns'),
('movement_pattern', 'pull', 'movement_patterns'),
('movement_pattern', 'squat', 'movement_patterns'),
('movement_pattern', 'hinge', 'movement_patterns'),
('movement_pattern', 'gait', 'movement_patterns'),
('exercise', 'overhead-press', 'exercises'),
('exercise', 'pull-up', 'exercises'),
('exercise', 'lat-pulldown', 'exercises'),
('exercise', 'deadlift', 'exercises'),
('exercise', 'squat', 'exercises'),
('exercise', 'romanian-deadlift', 'exercises'),
('exercise', 'forward-lunge', 'exercises'),
('exercise', 'reverse-lunge', 'exercises'),
('exercise', 'split-squat', 'exercises'),
('exercise', 'chest-fly', 'exercises'),
('exercise', 'lateral-raise', 'exercises'),
('exercise', 'biceps-curl', 'exercises'),
('exercise', 'triceps-pushdown', 'exercises'),
('equipment', 'suspension-trainer-trx', 'equipments'),
('equipment', 'ab-wheel', 'equipments'),
('equipment', 'medicine-ball', 'equipments'),
('exercise', 'leg-extension', 'exercises'),
('exercise', 'leg-curl', 'exercises'),
('exercise', 'plank', 'exercises'),
('exercise', 'kettlebell-swing', 'exercises'),
('exercise', 'farmer-carry', 'exercises'),
('exercise', 'walking', 'exercises'),
('exercise', 'cycling', 'exercises'),
('exercise', 'jump-rope', 'exercises'),
('exercise', 'elliptical-training', 'exercises'),
('exercise', 'rowing', 'exercises'),
('equipment', 'smith-machine', 'equipments'),
('equipment', 'cable-machine', 'equipments'),
('equipment', 'leg-press-machine', 'equipments'),
('equipment', 'chest-press-machine', 'equipments'),
('equipment', 'hack-squat-machine', 'equipments'),
('equipment', 'leg-extension-machine', 'equipments'),
('equipment', 'leg-curl-machine', 'equipments'),
('equipment', 'rear-delt-machine', 'equipments'),
('equipment', 'lat-pulldown-machine', 'equipments'),
('equipment', 'pull-up-bar', 'equipments'),
('equipment', 'dip-bar', 'equipments'),
('equipment', 'jump-rope', 'equipments'),
('equipment', 'treadmill', 'equipments'),
('equipment', 'stationary-bike', 'equipments'),
('equipment', 'elliptical-trainer', 'equipments'),
('equipment', 'rowing-machine', 'equipments'),
('equipment', 'flat-bench', 'equipments'),
('equipment', 'incline-bench', 'equipments'),
('equipment', 'decline-bench', 'equipments'),
('equipment', 'squat-rack', 'equipments'),
('equipment', 'power-rack', 'equipments'),
('movement_pattern', 'lunge', 'movement_patterns'),
('movement_pattern', 'carry', 'movement_patterns'),
('movement_pattern', 'rotation', 'movement_patterns'),
('muscle', 'abs', 'muscles'),
('muscle', 'abductors', 'muscles')
	) AS reference(entity_type, catalog_key, entity_table)
	WHERE CASE reference.entity_table
		WHEN 'exercises' THEN (SELECT id FROM exercises WHERE catalog_key = reference.catalog_key)
		WHEN 'exercise_variants' THEN (SELECT id FROM exercise_variants WHERE owner_user_id IS NULL AND catalog_key = reference.catalog_key)
		WHEN 'muscles' THEN (SELECT id FROM muscles WHERE catalog_key = reference.catalog_key)
		WHEN 'equipments' THEN (SELECT id FROM equipments WHERE catalog_key = reference.catalog_key)
		WHEN 'movement_patterns' THEN (SELECT id FROM movement_patterns WHERE catalog_key = reference.catalog_key)
	END IS NULL;

	IF missing_references IS NOT NULL THEN
		RAISE EXCEPTION 'Media seed references missing catalog keys: %', missing_references;
	END IF;
END $$;

WITH curated_media (storage_key, mime_type, width, height, source, alt_text, entity_type, catalog_key, entity_table, role, canonical_path, alt_text_en, alt_text_pt_br) AS (
VALUES
('assets/c6842d88-a584-48c5-9c20-f4b270d25413.svg', 'image/svg+xml', 960, 640, 'curated', 'Barbell bench press exercise illustration', 'exercise_variant', 'barbell-bench-press', 'exercise_variants', 'primary', '/media/exercise-barbell-bench-press.svg', 'Barbell bench press exercise illustration', 'Ilustração do exercício supino com barra'),
('assets/ae36d1e5-4e77-4a25-9d22-bc82b93e35d3.svg', 'image/svg+xml', 960, 640, 'curated', 'Chest muscle illustration', 'muscle', 'chest', 'muscles', 'primary', '/media/muscle-chest.svg', 'Chest muscle illustration', 'Ilustração do músculo peitoral'),
('assets/ce5b3f5e-3d3b-48b4-ab6d-efd0da01303a.png', 'image/png', 1536, 1024, 'curated', 'Bench press', 'exercise', 'bench-press', 'exercises', 'primary', '/media/catalog/exercises/bench-press.png', 'Bench press', 'Supino'),
('assets/2103e208-fab0-4090-aac3-43b23831bec2.png', 'image/png', 1536, 1024, 'curated', 'Push-up', 'exercise', 'push-up', 'exercises', 'primary', '/media/catalog/exercises/push-up.png', 'Push-up', 'Flexão de braços'),
('assets/d3637649-8db4-41f8-ab9a-efda8e04ad7d.png', 'image/png', 1536, 1024, 'curated', 'Row exercise', 'exercise', 'row', 'exercises', 'primary', '/media/catalog/exercises/row.png', 'Row exercise', 'Exercício de remada'),
('assets/d5ddd8f7-be5a-407f-882f-5aa730e64065.png', 'image/png', 1536, 1024, 'curated', 'Leg press', 'exercise', 'leg-press', 'exercises', 'primary', '/media/catalog/exercises/leg-press.png', 'Leg press', 'Leg press'),
('assets/6bd95191-8ef3-4e79-90d2-5a26b87b96bf.png', 'image/png', 1536, 1024, 'curated', 'Goblet squat', 'exercise_variant', 'goblet-squat', 'exercise_variants', 'primary', '/media/catalog/exercise-variants/goblet-squat.png', 'Goblet squat', 'Agachamento goblet'),
('assets/3311f613-fb38-4eff-8e24-e7ba3db222a4.png', 'image/png', 1536, 1024, 'curated', 'Hip extension', 'exercise', 'hip-extension', 'exercises', 'primary', '/media/catalog/exercises/hip-extension.png', 'Hip extension', 'Extensão de quadril'),
('assets/12bccdae-c3c1-4881-87f3-b6740ee342e4.png', 'image/png', 1536, 1024, 'curated', 'Running', 'exercise', 'running', 'exercises', 'primary', '/media/catalog/exercises/running.png', 'Running', 'Corrida'),
('assets/e325f2ae-2d43-4e6c-97f8-57a1e4e9bef7.png', 'image/png', 1536, 1024, 'curated', 'Barbell', 'equipment', 'barbell', 'equipments', 'primary', '/media/catalog/equipment/barbell.png', 'Barbell', 'Barra'),
('assets/42acbe1d-c9ec-4aa9-bc41-4eb145803bd2.png', 'image/png', 1536, 1024, 'curated', 'Dumbbell', 'equipment', 'dumbbell', 'equipments', 'primary', '/media/catalog/equipment/dumbbell.png', 'Dumbbell', 'Halter'),
('assets/17476cd3-0bc4-49cd-b51c-d2c04b756a22.png', 'image/png', 1536, 1024, 'curated', 'Kettlebell', 'equipment', 'kettlebell', 'equipments', 'primary', '/media/catalog/equipment/kettlebell.png', 'Kettlebell', 'Kettlebell'),
('assets/3705dd49-ad48-4259-a0ef-4855b3f722dd.png', 'image/png', 1536, 1024, 'curated', 'Resistance band', 'equipment', 'resistance-band', 'equipments', 'primary', '/media/catalog/equipment/resistance-band.png', 'Resistance band', 'Faixa elástica'),
('assets/69b42526-9ad4-4e6c-ab86-559d39db4b38.png', 'image/png', 1536, 1024, 'curated', 'Push movement pattern', 'movement_pattern', 'push', 'movement_patterns', 'primary', '/media/catalog/movement-patterns/push.png', 'Push movement pattern', 'Padrão de movimento de empurrar'),
('assets/6a29abbb-a014-4a69-88ed-4499dc21e455.png', 'image/png', 1536, 1024, 'curated', 'Pull movement pattern', 'movement_pattern', 'pull', 'movement_patterns', 'primary', '/media/catalog/movement-patterns/pull.png', 'Pull movement pattern', 'Padrão de movimento de puxar'),
('assets/1f1ef50f-0277-4d59-b9e7-cb22192defa0.png', 'image/png', 1536, 1024, 'curated', 'Squat movement pattern', 'movement_pattern', 'squat', 'movement_patterns', 'primary', '/media/catalog/movement-patterns/squat.png', 'Squat movement pattern', 'Padrão de movimento de agachar'),
('assets/9b88ece9-492c-4fe2-a60b-a6785ef4a24d.png', 'image/png', 1536, 1024, 'curated', 'Hinge movement pattern', 'movement_pattern', 'hinge', 'movement_patterns', 'primary', '/media/catalog/movement-patterns/hinge.png', 'Hinge movement pattern', 'Padrão de movimento de dobrar o quadril'),
('assets/b6f17a38-8e80-4b0c-8970-2ca61a84e77d.png', 'image/png', 1536, 1024, 'curated', 'Gait movement pattern', 'movement_pattern', 'gait', 'movement_patterns', 'primary', '/media/catalog/movement-patterns/gait.png', 'Gait movement pattern', 'Padrão de movimento de marcha'),
('assets/e8f3d661-3495-4a0a-80f4-392538284f2a.png', 'image/png', 1536, 1024, 'curated', 'Standing barbell overhead press', 'exercise', 'overhead-press', 'exercises', 'primary', '/media/catalog/exercises/overhead-press.png', 'Standing barbell overhead press', 'Desenvolvimento militar com barra em pé'),
('assets/ccd3705a-b5eb-4ba3-89b9-fbb718e66ebc.png', 'image/png', 1536, 1024, 'curated', 'Bodyweight pull-up', 'exercise', 'pull-up', 'exercises', 'primary', '/media/catalog/exercises/pull-up.png', 'Bodyweight pull-up', 'Barra fixa'),
('assets/efd5b000-bd42-4172-a45a-bc450d1ce64a.png', 'image/png', 1536, 1024, 'curated', 'Seated lat pulldown', 'exercise', 'lat-pulldown', 'exercises', 'primary', '/media/catalog/exercises/lat-pulldown.png', 'Seated lat pulldown', 'Puxada na frente em máquina'),
('assets/130e569e-704d-47c3-8396-2368acf2d4e8.png', 'image/png', 1536, 1024, 'curated', 'Conventional barbell deadlift setup', 'exercise', 'deadlift', 'exercises', 'primary', '/media/catalog/exercises/deadlift.png', 'Conventional barbell deadlift setup', 'Levantamento terra convencional com barra'),
('assets/b2f2ead8-33ab-4584-beb8-efa9eb80a19c.png', 'image/png', 1536, 1024, 'curated', 'Barbell back squat', 'exercise', 'squat', 'exercises', 'primary', '/media/catalog/exercises/squat.png', 'Barbell back squat', 'Agachamento livre com barra'),
('assets/340998ba-b0d2-4ee0-b0b2-0cae7d82d282.png', 'image/png', 1536, 1024, 'curated', 'Romanian deadlift', 'exercise', 'romanian-deadlift', 'exercises', 'primary', '/media/catalog/exercises/romanian-deadlift.png', 'Romanian deadlift', 'Levantamento terra romeno'),
('assets/34ee5236-0cff-4455-ad04-95252e43d59c.png', 'image/png', 1536, 1024, 'curated', 'Forward lunge', 'exercise', 'forward-lunge', 'exercises', 'primary', '/media/catalog/exercises/forward-lunge.png', 'Forward lunge', 'Afundo à frente'),
('assets/03066415-075d-4c20-8290-4876a38d6a20.png', 'image/png', 1536, 1024, 'curated', 'Reverse lunge', 'exercise', 'reverse-lunge', 'exercises', 'primary', '/media/catalog/exercises/reverse-lunge.png', 'Reverse lunge', 'Afundo reverso'),
('assets/2e4c1d73-8a56-4b8a-acfc-2935b55cf97a.png', 'image/png', 1536, 1024, 'curated', 'Split squat', 'exercise', 'split-squat', 'exercises', 'primary', '/media/catalog/exercises/split-squat.png', 'Split squat', 'Agachamento dividido'),
('assets/566d2c8d-2192-44be-a14b-adf8406ae7ce.png', 'image/png', 1536, 1024, 'curated', 'Chest fly', 'exercise', 'chest-fly', 'exercises', 'primary', '/media/catalog/exercises/chest-fly.png', 'Chest fly', 'Crucifixo'),
('assets/139cd887-f039-45e9-9cb1-388abde334d7.png', 'image/png', 1536, 1024, 'curated', 'Lateral raise', 'exercise', 'lateral-raise', 'exercises', 'primary', '/media/catalog/exercises/lateral-raise.png', 'Lateral raise', 'Elevação lateral'),
('assets/a094de67-4bad-4633-a917-c05d48fb95b2.png', 'image/png', 1536, 1024, 'curated', 'Biceps curl', 'exercise', 'biceps-curl', 'exercises', 'primary', '/media/catalog/exercises/biceps-curl.png', 'Biceps curl', 'Rosca bíceps'),
('assets/931521b3-4bce-42c8-b8be-a8c4e5e81edb.png', 'image/png', 1536, 1024, 'curated', 'Cable triceps pushdown', 'exercise', 'triceps-pushdown', 'exercises', 'primary', '/media/catalog/exercises/triceps-pushdown.png', 'Cable triceps pushdown', 'Tríceps na polia'),
('assets/57b52c65-9394-4116-b4a2-a3a53016a7d1.png', 'image/png', 1536, 1024, 'curated', 'Suspension trainer', 'equipment', 'suspension-trainer-trx', 'equipments', 'primary', '/media/catalog/equipment/suspension-trainer-trx.png', 'Suspension trainer', 'Treinador de suspensão'),
('assets/76d6aa65-6d6d-4be3-bd6f-f7f8d6d1d53a.png', 'image/png', 1536, 1024, 'curated', 'Ab wheel', 'equipment', 'ab-wheel', 'equipments', 'primary', '/media/catalog/equipment/ab-wheel.png', 'Ab wheel', 'Roda abdominal'),
('assets/59283658-2dba-43db-90af-89adede0da34.png', 'image/png', 1536, 1024, 'curated', 'Textured medicine ball', 'equipment', 'medicine-ball', 'equipments', 'primary', '/media/catalog/equipment/medicine-ball.png', 'Textured medicine ball', 'Bola medicinal texturizada'),
('assets/239ffd95-f8a0-4d8a-858c-1c70fa5cf26e.png', 'image/png', 1536, 1024, 'curated', 'Seated leg extension', 'exercise', 'leg-extension', 'exercises', 'primary', '/media/catalog/exercises/leg-extension.png', 'Seated leg extension', 'Extensão de pernas sentada'),
('assets/95ee5c4f-6b98-462d-aff4-91852434304e.png', 'image/png', 1536, 1024, 'curated', 'Prone leg curl', 'exercise', 'leg-curl', 'exercises', 'primary', '/media/catalog/exercises/leg-curl.png', 'Prone leg curl', 'Flexão de pernas deitado'),
('assets/015bb97c-d889-4f81-8ec4-9c5f5084774f.png', 'image/png', 1536, 1024, 'curated', 'High plank', 'exercise', 'plank', 'exercises', 'primary', '/media/catalog/exercises/plank.png', 'High plank', 'Prancha alta'),
('assets/ff30f7ef-a27f-485e-aaa8-66e63928bee0.png', 'image/png', 1536, 1024, 'curated', 'Two-handed kettlebell swing', 'exercise', 'kettlebell-swing', 'exercises', 'primary', '/media/catalog/exercises/kettlebell-swing.png', 'Two-handed kettlebell swing', 'Balanço com kettlebell usando as duas mãos'),
('assets/e58e3ee0-5f6a-46dd-9293-1cb5437a1f35.png', 'image/png', 1536, 1024, 'curated', 'Farmer carry with two dumbbells', 'exercise', 'farmer-carry', 'exercises', 'primary', '/media/catalog/exercises/farmer-carry.png', 'Farmer carry with two dumbbells', 'Caminhada do fazendeiro com dois halteres'),
('assets/d886095e-cfa1-4096-8336-5e71d506bb2c.png', 'image/png', 1536, 1024, 'curated', 'Brisk walking', 'exercise', 'walking', 'exercises', 'primary', '/media/catalog/exercises/walking.png', 'Brisk walking', 'Caminhada acelerada'),
('assets/9bd69c7c-7513-4d63-a7a4-bc79484ec4c1.png', 'image/png', 1536, 1024, 'curated', 'Stationary cycling', 'exercise', 'cycling', 'exercises', 'primary', '/media/catalog/exercises/cycling.png', 'Stationary cycling', 'Ciclismo em bicicleta ergométrica'),
('assets/7ca15f2b-6887-449a-8fc0-e59326503be8.png', 'image/png', 1536, 1024, 'curated', 'Jump rope', 'exercise', 'jump-rope', 'exercises', 'primary', '/media/catalog/exercises/jump-rope.png', 'Jump rope', 'Pular corda'),
('assets/8389125a-5646-4321-91ef-975d6cb605cb.png', 'image/png', 1536, 1024, 'curated', 'Elliptical training', 'exercise', 'elliptical-training', 'exercises', 'primary', '/media/catalog/exercises/elliptical-training.png', 'Elliptical training', 'Treino em máquina elíptica'),
('assets/eab2b0c8-2922-475a-b595-682b36fb285e.png', 'image/png', 1536, 1024, 'curated', 'Indoor rowing', 'exercise', 'rowing', 'exercises', 'primary', '/media/catalog/exercises/rowing.png', 'Indoor rowing', 'Remo indoor'),
('assets/c35bc9de-5eff-40f1-a172-3a2e574c2a09.png', 'image/png', 1536, 1024, 'curated', 'Guided-bar Smith machine', 'equipment', 'smith-machine', 'equipments', 'primary', '/media/catalog/equipment/smith-machine.png', 'Guided-bar Smith machine', 'Máquina Smith com barra guiada'),
('assets/b8354233-1e72-44e3-b8a0-cf00df1bc429.png', 'image/png', 1536, 1024, 'curated', 'Dual-pulley cable machine', 'equipment', 'cable-machine', 'equipments', 'primary', '/media/catalog/equipment/cable-machine.png', 'Dual-pulley cable machine', 'Máquina de cabos com polias duplas'),
('assets/dca4db99-f929-4606-a904-8f4962070121.png', 'image/png', 1536, 1024, 'curated', '45-degree sled leg press', 'equipment', 'leg-press-machine', 'equipments', 'primary', '/media/catalog/equipment/leg-press-machine.png', '45-degree sled leg press', 'Leg press com trenó a 45 graus'),
('assets/0b7b36e0-3f2d-4c84-b841-b5bf2c1c0118.png', 'image/png', 1536, 1024, 'curated', 'Seated selectorized chest press', 'equipment', 'chest-press-machine', 'equipments', 'primary', '/media/catalog/equipment/chest-press-machine.png', 'Seated selectorized chest press', 'Máquina de supino sentado com pilha de pesos'),
('assets/569c4d30-6d78-4044-a2a0-443f2fe48fff.png', 'image/png', 1536, 1024, 'curated', 'Plate-loaded hack squat', 'equipment', 'hack-squat-machine', 'equipments', 'primary', '/media/catalog/equipment/hack-squat-machine.png', 'Plate-loaded hack squat', 'Hack squat com carga por anilhas'),
('assets/824d30eb-d792-4d34-abe7-571e11d89421.png', 'image/png', 1536, 1024, 'curated', 'Seated leg extension machine', 'equipment', 'leg-extension-machine', 'equipments', 'primary', '/media/catalog/equipment/leg-extension-machine.png', 'Seated leg extension machine', 'Máquina de extensão de pernas sentada'),
('assets/0cb164f2-0183-4b20-8dac-550317d36fdb.png', 'image/png', 1536, 1024, 'curated', 'Prone leg curl machine', 'equipment', 'leg-curl-machine', 'equipments', 'primary', '/media/catalog/equipment/leg-curl-machine.png', 'Prone leg curl machine', 'Máquina de flexão de pernas deitado'),
('assets/6e42d0c1-c0e2-4626-8baa-9b45136cd30d.png', 'image/png', 1536, 1024, 'curated', 'Reverse-pec-deck rear delt machine', 'equipment', 'rear-delt-machine', 'equipments', 'primary', '/media/catalog/equipment/rear-delt-machine.png', 'Reverse-pec-deck rear delt machine', 'Máquina de deltoide posterior reversa'),
('assets/051c745b-2889-4fd9-8217-48eaf719b148.png', 'image/png', 1536, 1024, 'curated', 'Seated lat pulldown machine', 'equipment', 'lat-pulldown-machine', 'equipments', 'primary', '/media/catalog/equipment/lat-pulldown-machine.png', 'Seated lat pulldown machine', 'Máquina de puxada na frente sentada'),
('assets/4e3a9028-cb5e-44dc-b8a7-e7d688128ca4.png', 'image/png', 1536, 1024, 'curated', 'Freestanding pull-up bar station', 'equipment', 'pull-up-bar', 'equipments', 'primary', '/media/catalog/equipment/pull-up-bar.png', 'Freestanding pull-up bar station', 'Estação de barra fixa independente'),
('assets/ecb310d9-d32d-419e-8bfd-dd9291cb1f19.png', 'image/png', 1536, 1024, 'curated', 'Freestanding parallel dip bar station', 'equipment', 'dip-bar', 'equipments', 'primary', '/media/catalog/equipment/dip-bar.png', 'Freestanding parallel dip bar station', 'Estação de barras paralelas'),
('assets/dad23553-3ed3-4a57-9952-353fa2693db3.png', 'image/png', 1536, 1024, 'curated', 'Adjustable jump rope', 'equipment', 'jump-rope', 'equipments', 'primary', '/media/catalog/equipment/jump-rope.png', 'Adjustable jump rope', 'Corda de pular ajustável'),
('assets/bd5df11f-b5a1-479a-8352-65b52a29d07c.png', 'image/png', 1536, 1024, 'curated', 'Motorized treadmill', 'equipment', 'treadmill', 'equipments', 'primary', '/media/catalog/equipment/treadmill.png', 'Motorized treadmill', 'Esteira motorizada'),
('assets/4095e8ff-2d78-47ba-9f76-671994044658.png', 'image/png', 1536, 1024, 'curated', 'Upright stationary exercise bike', 'equipment', 'stationary-bike', 'equipments', 'primary', '/media/catalog/equipment/stationary-bike.png', 'Upright stationary exercise bike', 'Bicicleta ergométrica vertical'),
('assets/277205d9-c1ad-4afd-aa76-b3ab77d517c9.png', 'image/png', 1536, 1024, 'curated', 'Elliptical trainer', 'equipment', 'elliptical-trainer', 'equipments', 'primary', '/media/catalog/equipment/elliptical-trainer.png', 'Elliptical trainer', 'Treinador elíptico'),
('assets/9ef8c9f2-6d4b-4d8c-9ca6-3733ede17bb7.png', 'image/png', 1536, 1024, 'curated', 'Indoor rowing machine', 'equipment', 'rowing-machine', 'equipments', 'primary', '/media/catalog/equipment/rowing-machine.png', 'Indoor rowing machine', 'Máquina de remo indoor'),
('assets/0d342a97-8aa7-4d34-a7d3-b6de5f5c80d3.png', 'image/png', 1536, 1024, 'curated', 'Flat weight bench', 'equipment', 'flat-bench', 'equipments', 'primary', '/media/catalog/equipment/flat-bench.png', 'Flat weight bench', 'Banco reto de musculação'),
('assets/6e902d49-8170-46ee-a06c-0d58729d61c3.png', 'image/png', 1536, 1024, 'curated', 'Adjustable incline weight bench', 'equipment', 'incline-bench', 'equipments', 'primary', '/media/catalog/equipment/incline-bench.png', 'Adjustable incline weight bench', 'Banco inclinado ajustável'),
('assets/d98ec878-8670-4105-9c85-7e34f3e85a25.png', 'image/png', 1536, 1024, 'curated', 'Decline weight bench with ankle rollers', 'equipment', 'decline-bench', 'equipments', 'primary', '/media/catalog/equipment/decline-bench.png', 'Decline weight bench with ankle rollers', 'Banco declinado com rolos para tornozelos'),
('assets/850afc0c-6d8a-4731-95b6-2b544b108e82.png', 'image/png', 1536, 1024, 'curated', 'Open-front squat rack with safety arms', 'equipment', 'squat-rack', 'equipments', 'primary', '/media/catalog/equipment/squat-rack.png', 'Open-front squat rack with safety arms', 'Rack de agachamento aberto com braços de segurança'),
('assets/2d80b2fa-8a08-490b-ae91-28059d1c3f26.png', 'image/png', 1536, 1024, 'curated', 'Four-post power rack with safety pins', 'equipment', 'power-rack', 'equipments', 'primary', '/media/catalog/equipment/power-rack.png', 'Four-post power rack with safety pins', 'Power rack de quatro postes com pinos de segurança'),
('assets/081e3de1-6055-4684-8158-d74370e081d4.png', 'image/png', 1536, 1024, 'curated', 'Lunge movement pattern', 'movement_pattern', 'lunge', 'movement_patterns', 'primary', '/media/catalog/movement-patterns/lunge.png', 'Lunge movement pattern', 'Padrão de movimento de afundo'),
('assets/f13490a7-762a-4909-8d7d-7b3f064bfc5a.png', 'image/png', 1536, 1024, 'curated', 'Loaded carry movement pattern', 'movement_pattern', 'carry', 'movement_patterns', 'primary', '/media/catalog/movement-patterns/carry.png', 'Loaded carry movement pattern', 'Padrão de movimento de transporte de carga'),
('assets/398e6c88-4553-4f4d-bcb7-6c4538bb73b4.png', 'image/png', 1536, 1024, 'curated', 'Trunk rotation movement pattern', 'movement_pattern', 'rotation', 'movement_patterns', 'primary', '/media/catalog/movement-patterns/rotation.png', 'Trunk rotation movement pattern', 'Padrão de movimento de rotação do tronco'),
('assets/8d2152c1-03e1-4ddc-89ee-c0a99bb2e991.jpg', 'image/jpeg', 730, 456, 'curated', 'abdomen', 'muscle', 'abs', 'muscles', 'primary', '/media/catalog/promoted/muscle-abs-f1fe5fead20e2bb4.jpg', 'abdomen', 'abdominal'),
('assets/ab2a5fc5-f6ab-468b-9b88-b5bf776bd106.jpg', 'image/jpeg', 1124, 1092, 'curated', '123', 'muscle', 'abductors', 'muscles', 'primary', '/media/catalog/promoted/muscle-abductors-f1fe5fead20e2bb4.jpg', '123', '345')
), inserted_assets AS (
	INSERT INTO media_assets (storage_key, mime_type, width, height, source, alt_text)
	SELECT storage_key, mime_type, width, height, source, alt_text
	FROM curated_media
	RETURNING id, storage_key
), inserted_assignments AS (
	INSERT INTO entity_media (media_asset_id, entity_type, entity_id, role, canonical_path)
	SELECT inserted_assets.id, curated_media.entity_type,
		CASE curated_media.entity_table
			WHEN 'exercises' THEN (SELECT id FROM exercises WHERE catalog_key = curated_media.catalog_key)
			WHEN 'exercise_variants' THEN (SELECT id FROM exercise_variants WHERE owner_user_id IS NULL AND catalog_key = curated_media.catalog_key)
			WHEN 'muscles' THEN (SELECT id FROM muscles WHERE catalog_key = curated_media.catalog_key)
			WHEN 'equipments' THEN (SELECT id FROM equipments WHERE catalog_key = curated_media.catalog_key)
			WHEN 'movement_patterns' THEN (SELECT id FROM movement_patterns WHERE catalog_key = curated_media.catalog_key)
		END,
		curated_media.role,
		curated_media.canonical_path
	FROM curated_media
	JOIN inserted_assets ON inserted_assets.storage_key = curated_media.storage_key
	RETURNING media_asset_id
)
INSERT INTO media_asset_alt_texts (media_asset_id, locale, alt_text)
SELECT inserted_assignments.media_asset_id, localized.locale, localized.alt_text
FROM inserted_assignments
JOIN inserted_assets ON inserted_assets.id = inserted_assignments.media_asset_id
JOIN curated_media ON curated_media.storage_key = inserted_assets.storage_key
CROSS JOIN LATERAL (VALUES
	('en', curated_media.alt_text_en),
	('pt-BR', curated_media.alt_text_pt_br)
) AS localized(locale, alt_text);

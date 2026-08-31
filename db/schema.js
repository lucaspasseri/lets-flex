export const schemaSql = `
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS guest_creation_limits CASCADE;
DROP TABLE IF EXISTS workout_set_logs CASCADE;
DROP TABLE IF EXISTS workout_step_logs CASCADE;
DROP TABLE IF EXISTS workout_sessions CASCADE;
DROP TABLE IF EXISTS session_steps CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS training_days CASCADE;
DROP TABLE IF EXISTS cycles CASCADE;
DROP TABLE IF EXISTS programs CASCADE;

DROP TABLE IF EXISTS exercise_muscles CASCADE;
DROP TABLE IF EXISTS exercise_variants CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS movement_patterns CASCADE;
DROP TABLE IF EXISTS muscles CASCADE;
DROP TABLE IF EXISTS muscle_roles CASCADE;
DROP TABLE IF EXISTS equipments CASCADE;
DROP TABLE IF EXISTS step_types CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS workout_step_log_status CASCADE;
DROP TYPE IF EXISTS workout_session_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

CREATE TYPE user_role AS ENUM ('user', 'admin', 'guest');

CREATE TABLE users (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	email VARCHAR(254),
	password_hash TEXT,
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
	CONSTRAINT users_credentials_by_role CHECK (
		(role IN ('user', 'admin') AND email IS NOT NULL AND password_hash IS NOT NULL AND guest_expires_at IS NULL)
		OR
		(role = 'guest' AND email IS NULL AND password_hash IS NULL AND guest_expires_at IS NOT NULL AND date_of_birth IS NULL AND anamnesis IS NULL)
	)
);

CREATE UNIQUE INDEX users_email_unique
ON users (email)
WHERE email IS NOT NULL;

CREATE INDEX users_expired_guests_idx
ON users (guest_expires_at, id)
WHERE role = 'guest';

CREATE TABLE goals (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	name VARCHAR NOT NULL
);

CREATE TABLE programs (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
	name VARCHAR,
	start_date DATE DEFAULT CURRENT_DATE
);

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
	name VARCHAR NOT NULL UNIQUE,
	notes TEXT
);

CREATE TABLE equipments (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	name VARCHAR NOT NULL,
	category VARCHAR
);

CREATE TABLE exercises (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	name VARCHAR NOT NULL,
	movement_pattern_id INTEGER REFERENCES movement_patterns(id),
	is_archived BOOLEAN NOT NULL DEFAULT FALSE,
	created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE exercise_variants (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
	owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
	equipment_id INTEGER REFERENCES equipments(id) ON DELETE SET NULL,
	name VARCHAR NOT NULL,
	setup_description TEXT,
	environment VARCHAR,
	notes TEXT,
	is_archived BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT exercise_variants_trimmed_name CHECK (name = BTRIM(name) AND name <> '')
);

CREATE UNIQUE INDEX exercise_variants_private_name_unique
ON exercise_variants (exercise_id, owner_user_id, LOWER(name))
WHERE owner_user_id IS NOT NULL;

CREATE UNIQUE INDEX exercise_variants_global_name_unique
ON exercise_variants (exercise_id, LOWER(name))
WHERE owner_user_id IS NULL;

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
	common_name VARCHAR NOT NULL,
	scientific_name VARCHAR,
	body_region VARCHAR,
	reference_url VARCHAR
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

CREATE TABLE "session" (
	"sid" VARCHAR NOT NULL PRIMARY KEY,
	"sess" JSON NOT NULL,
	"expire" TIMESTAMP(6) NOT NULL
);

CREATE INDEX session_expire_idx ON "session" ("expire");

CREATE TABLE guest_creation_limits (
	key_hash VARCHAR(64) NOT NULL,
	window_started_at TIMESTAMPTZ NOT NULL,
	attempts INTEGER NOT NULL DEFAULT 1,
	PRIMARY KEY (key_hash, window_started_at)
);

CREATE INDEX guest_creation_limits_window_idx
ON guest_creation_limits (window_started_at);

INSERT INTO "step_types" ("name")
VALUES
  ('exercise'),
  ('warm_up'),
  ('cardio'),
  ('stretching'),
  ('mobility'),
  ('cooldown');

INSERT INTO "movement_patterns" ("name")
VALUES
  ('push'),
  ('pull'),
  ('squat'),
  ('hinge'),
  ('lunge'),
  ('carry'),
  ('rotation'),
  ('gait');

INSERT INTO "goals" ("name")
VALUES
  ('hypertrophy'),
  ('strength'),
  ('weight_loss'),
  ('conditioning'),
  ('mobility'),
  ('rehabilitation'),
  ('general_fitness');

INSERT INTO muscles (common_name, scientific_name, body_region, reference_url) VALUES
	('Chest', 'Pectoralis Major', 'Upper Body - Anterior', 'https://en.wikipedia.org/wiki/Pectoralis_major'),
	('Upper Chest', 'Clavicular Head of Pectoralis Major', 'Upper Body - Anterior', 'https://en.wikipedia.org/wiki/Pectoralis_major'),
	('Lower Chest', 'Sternal Head of Pectoralis Major', 'Upper Body - Anterior', 'https://en.wikipedia.org/wiki/Pectoralis_major'),
	('Upper Back', 'Trapezius', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Trapezius'),
	('Lats', 'Latissimus Dorsi', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Latissimus_dorsi'),
	('Mid Back', 'Rhomboids', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Rhomboid_muscles'),
	('Lower Back', 'Erector Spinae', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Erector_spinae'),
	('Front Delts', 'Anterior Deltoid', 'Upper Body - Anterior', 'https://en.wikipedia.org/wiki/Deltoid_muscle'),
	('Side Delts', 'Lateral Deltoid', 'Upper Body - Lateral', 'https://en.wikipedia.org/wiki/Deltoid_muscle'),
	('Rear Delts', 'Posterior Deltoid', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Deltoid_muscle'),
	('Biceps', 'Biceps Brachii', 'Upper Body - Anterior', 'https://en.wikipedia.org/wiki/Biceps'),
	('Triceps', 'Triceps Brachii', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Triceps'),
	('Forearms', 'Forearm Flexors and Extensors', 'Upper Body - Distal', 'https://en.wikipedia.org/wiki/Forearm'),
	('Abs', 'Rectus Abdominis', 'Core - Anterior', 'https://en.wikipedia.org/wiki/Rectus_abdominis'),
	('Obliques', 'External Obliques', 'Core - Lateral', 'https://en.wikipedia.org/wiki/Abdominal_oblique_muscles'),
	('Deep Core', 'Transverse Abdominis', 'Core - Anterior', 'https://en.wikipedia.org/wiki/Transverse_abdominal_muscle'),
	('Glutes', 'Gluteus Maximus', 'Lower Body - Posterior', 'https://en.wikipedia.org/wiki/Gluteus_maximus'),
	('Glute Med', 'Gluteus Medius', 'Lower Body - Lateral', 'https://en.wikipedia.org/wiki/Gluteus_medius'),
	('Quads', 'Quadriceps', 'Lower Body - Anterior', 'https://en.wikipedia.org/wiki/Quadriceps'),
	('Hamstrings', 'Hamstrings', 'Lower Body - Posterior', 'https://en.wikipedia.org/wiki/Hamstring'),
	('Adductors', 'Hip Adductors', 'Lower Body - Medial', 'https://en.wikipedia.org/wiki/Adductor_muscles_of_the_hip'),
	('Abductors', 'Hip Abductors', 'Lower Body - Lateral', 'https://en.wikipedia.org/wiki/Hip_abductor'),
	('Calves', 'Gastrocnemius', 'Lower Body - Posterior', 'https://en.wikipedia.org/wiki/Gastrocnemius'),
	('Soleus', 'Soleus', 'Lower Body - Posterior', 'https://en.wikipedia.org/wiki/Soleus');

INSERT INTO equipments (name, category) VALUES
  ('Barbell', 'free_weight'),
  ('Dumbbell', 'free_weight'),
  ('Kettlebell', 'free_weight'),
  ('Smith Machine', 'machine'),
  ('Cable Machine', 'machine'),
  ('Leg Press Machine', 'machine'),
  ('Chest Press Machine', 'machine'),
  ('Lat Pulldown Machine', 'machine'),
  ('Pull-up Bar', 'bodyweight'),
  ('Dip Bar', 'bodyweight'),
  ('Resistance Band', 'accessory'),
  ('Suspension Trainer (TRX)', 'accessory'),
  ('Ab Wheel', 'accessory'),
  ('Medicine Ball', 'accessory'),
  ('Treadmill', 'cardio'),
  ('Stationary Bike', 'cardio'),
  ('Elliptical Trainer', 'cardio'),
  ('Rowing Machine', 'cardio'),
  ('Flat Bench', 'support'),
  ('Incline Bench', 'support'),
  ('Decline Bench', 'support'),
  ('Squat Rack', 'support'),
  ('Power Rack', 'support');

INSERT INTO "muscle_roles" ("name", "description") VALUES
  ('prime_mover', 'Primary muscle responsible for producing the movement (agonist)'),
  ('synergist', 'Assists the prime mover in performing the movement'),
  ('stabilizer', 'Stabilizes a joint or body segment during movement'),
  ('antagonist', 'Opposes the action of the prime mover'),
  ('fixator', 'Stabilizes the origin of the prime mover'),
  ('dynamic_stabilizer', 'Provides stability while also contributing to movement'),
  ('secondary_mover', 'Contributes to movement but not as dominant as the prime mover');

INSERT INTO exercises (name, movement_pattern_id)
SELECT 'Push Up', id FROM movement_patterns WHERE name = 'push';

INSERT INTO exercises (name, movement_pattern_id)
SELECT 'Squat', id FROM movement_patterns WHERE name = 'squat';

INSERT INTO exercise_variants (exercise_id, equipment_id, name, setup_description, environment, notes)
SELECT e.id, NULL, 'Bodyweight Push Up', 'Hands beneath shoulders with a braced trunk.', 'gym_or_home', 'Global sample variant.'
FROM exercises e WHERE e.name = 'Push Up';

INSERT INTO exercise_variants (exercise_id, equipment_id, name, setup_description, environment, notes)
SELECT e.id, eq.id, 'Barbell Back Squat', 'Barbell supported across the upper back.', 'gym', 'Global sample variant.'
FROM exercises e
JOIN equipments eq ON eq.name = 'Barbell'
WHERE e.name = 'Squat';

INSERT INTO sessions (name, notes)
VALUES ('Sample Full Body Session', 'A read-only global session template.');

INSERT INTO session_steps (
	session_id, step_type_id, exercise_variant_id, name, sets, reps, step_order
)
SELECT s.id, st.id, ev.id, 'Push ups', 3, 10, 1
FROM sessions s
JOIN step_types st ON st.name = 'exercise'
JOIN exercise_variants ev ON ev.name = 'Bodyweight Push Up'
WHERE s.name = 'Sample Full Body Session';
`;

import { Client } from "pg";

const sql = `
DROP TABLE IF EXISTS "workout_step_logs" CASCADE;
DROP TABLE IF EXISTS "session_steps" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "training_days" CASCADE;
DROP TABLE IF EXISTS "cycles" CASCADE;
DROP TABLE IF EXISTS "programs" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "goals" CASCADE;
DROP TABLE IF EXISTS "step_types" CASCADE;
DROP TABLE IF EXISTS "equipments" CASCADE;
DROP TABLE IF EXISTS "exercise_variants" CASCADE;
DROP TABLE IF EXISTS "exercises" CASCADE;
DROP TABLE IF EXISTS "movement_patterns" CASCADE;
DROP TABLE IF EXISTS "exercise_muscles" CASCADE;
DROP TABLE IF EXISTS "muscles" CASCADE;
DROP TABLE IF EXISTS "muscle_roles" CASCADE;

CREATE TABLE "users" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar,
  "date_of_birth" date,
  "anamnesis" text
);

CREATE TABLE "goals" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar
);

CREATE TABLE "programs" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "user_id" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "goal_id" integer,
  "name" varchar,
  "start_date" date DEFAULT CURRENT_DATE
);

CREATE TABLE cycles (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cycle_size INTEGER DEFAULT 7,
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

CREATE TABLE "sessions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "training_day_id" INTEGER NOT NULL REFERENCES training_days(id) ON DELETE CASCADE,
  "name" varchar,
  "notes" text,
  "session_order" integer NOT NULL,

  UNIQUE (training_day_id, session_order)
);

CREATE TABLE "session_steps" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "session_id" integer NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  "step_type_id" integer NOT NULL,
  "exercise_variant_id" integer,
  "name" varchar,
  "sets" integer,
  "reps" integer,
  "load_value" float,
  "load_unit" varchar,
  "step_order" integer NOT NULL,
  UNIQUE (session_id, step_order)
);

CREATE TABLE "workout_step_logs" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "session_step_id" integer NOT NULL REFERENCES session_steps(id) ON DELETE CASCADE,
  "performed_at" timestamp,
  "sets" integer,
  "reps" integer,
  "load_value" float,
  "load_unit" varchar
);

CREATE TABLE "step_types" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar
);

CREATE TABLE "exercise_variants" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "exercise_id" integer NOT NULL,
  "equipment_id" integer,
  "name" varchar,
  "setup_description" text,
  "environment" varchar,
  "notes" text
);

CREATE TABLE "equipments" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar,
  "category" varchar
);

CREATE TABLE "exercises" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar,
  "movement_pattern_id" integer
);

CREATE TABLE "movement_patterns" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar,
  "notes" text
);

CREATE TABLE "muscles" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "common_name" varchar,
  "scientific_name" varchar,
  "body_region" varchar,
  "reference_url" varchar
);

CREATE TABLE "muscle_roles" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar UNIQUE NOT NULL,
  "description" text
);

CREATE TABLE "exercise_muscles" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "exercise_id" integer NOT NULL,
  "muscle_id" integer NOT NULL,
  "muscle_role_id" integer NOT NULL,
  FOREIGN KEY ("exercise_id") REFERENCES "exercises"(id) ON DELETE CASCADE,
  FOREIGN KEY ("muscle_id") REFERENCES "muscles"(id) ON DELETE CASCADE,
  FOREIGN KEY ("muscle_role_id") REFERENCES "muscle_roles"(id)
);

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
	-- Chest
	('Chest', 'Pectoralis Major', 'Upper Body - Anterior', 'https://en.wikipedia.org/wiki/Pectoralis_major'),
	('Upper Chest', 'Clavicular Head of Pectoralis Major', 'Upper Body - Anterior', 'https://en.wikipedia.org/wiki/Pectoralis_major'),
	('Lower Chest', 'Sternal Head of Pectoralis Major', 'Upper Body - Anterior', 'https://en.wikipedia.org/wiki/Pectoralis_major'),

	-- Back
	('Upper Back', 'Trapezius', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Trapezius'),
	('Lats', 'Latissimus Dorsi', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Latissimus_dorsi'),
	('Mid Back', 'Rhomboids', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Rhomboid_muscles'),
	('Lower Back', 'Erector Spinae', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Erector_spinae'),

	-- Shoulders
	('Front Delts', 'Anterior Deltoid', 'Upper Body - Anterior', 'https://en.wikipedia.org/wiki/Deltoid_muscle'),
	('Side Delts', 'Lateral Deltoid', 'Upper Body - Lateral', 'https://en.wikipedia.org/wiki/Deltoid_muscle'),
	('Rear Delts', 'Posterior Deltoid', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Deltoid_muscle'),

	-- Arms
	('Biceps', 'Biceps Brachii', 'Upper Body - Anterior', 'https://en.wikipedia.org/wiki/Biceps'),
	('Triceps', 'Triceps Brachii', 'Upper Body - Posterior', 'https://en.wikipedia.org/wiki/Triceps'),
	('Forearms', 'Forearm Flexors and Extensors', 'Upper Body - Distal', 'https://en.wikipedia.org/wiki/Forearm'),

	-- Core
	('Abs', 'Rectus Abdominis', 'Core - Anterior', 'https://en.wikipedia.org/wiki/Rectus_abdominis'),
	('Obliques', 'External Obliques', 'Core - Lateral', 'https://en.wikipedia.org/wiki/Abdominal_oblique_muscles'),
	('Deep Core', 'Transverse Abdominis', 'Core - Anterior', 'https://en.wikipedia.org/wiki/Transverse_abdominal_muscle'),

	-- Glutes
	('Glutes', 'Gluteus Maximus', 'Lower Body - Posterior', 'https://en.wikipedia.org/wiki/Gluteus_maximus'),
	('Glute Med', 'Gluteus Medius', 'Lower Body - Lateral', 'https://en.wikipedia.org/wiki/Gluteus_medius'),

	-- Legs
	('Quads', 'Quadriceps', 'Lower Body - Anterior', 'https://en.wikipedia.org/wiki/Quadriceps'),
	('Hamstrings', 'Hamstrings', 'Lower Body - Posterior', 'https://en.wikipedia.org/wiki/Hamstring'),
	('Adductors', 'Hip Adductors', 'Lower Body - Medial', 'https://en.wikipedia.org/wiki/Adductor_muscles_of_the_hip'),
	('Abductors', 'Hip Abductors', 'Lower Body - Lateral', 'https://en.wikipedia.org/wiki/Hip_abductor'),

	-- Calves
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
`;

async function main() {
	console.log("Seeding database...");

	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: process.env.DATABASE_URL?.includes("neon")
			? { rejectUnauthorized: false }
			: false,
	});

	try {
		await client.connect();
		await client.query(sql);
		console.log("Database seeded successfully.");
	} catch (err) {
		console.error("Error while seeding database:", err);
	} finally {
		await client.end();
		console.log("Connection closed.");
	}
}

main();

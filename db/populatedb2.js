import { Client } from "pg";

const sql = `
DROP TABLE IF EXISTS "workout_step_logs" CASCADE;
DROP TABLE IF EXISTS "session_steps" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "cycles" CASCADE;
DROP TABLE IF EXISTS "programs" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "goals" CASCADE;
DROP TABLE IF EXISTS "step_types" CASCADE;
DROP TABLE IF EXISTS "exercise_variants" CASCADE;
DROP TABLE IF EXISTS "equipments" CASCADE;
DROP TABLE IF EXISTS "exercises_muscles" CASCADE;
DROP TABLE IF EXISTS "muscles" CASCADE;
DROP TABLE IF EXISTS "exercises" CASCADE;
DROP TABLE IF EXISTS "movement_patterns" CASCADE;

CREATE TABLE "users" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar,
  "date_of_birth" date,
  "anamnese" text
);

CREATE TABLE "goals" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar
);

CREATE TABLE "programs" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "user_id" integer NOT NULL,
  "goal_id" integer,
  "name" varchar,
  "start_date" timestamp DEFAULT now()
);

CREATE TABLE "cycles" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "program_id" integer NOT NULL,
  "name" varchar,
  "cycle_order" integer
);

CREATE TABLE "sessions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "cycle_id" integer NOT NULL,
  "name" varchar,
  "session_order" integer,
  "notes" text
);

CREATE TABLE "step_types" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar
);

CREATE TABLE "equipments" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar,
  "category" varchar
);

CREATE TABLE "movement_patterns" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar,
  "notes" text
);

CREATE TABLE "exercises" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar,
  "movement_pattern_id" integer
);

CREATE TABLE "exercise_variants" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "exercise_id" integer NOT NULL,
  "equipment_id" integer,
  "setup_description" text,
  "environment" varchar,
  "notes" text
);

CREATE TABLE "session_steps" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "session_id" integer NOT NULL,
  "step_type_id" integer NOT NULL,
  "exercise_variant_id" integer,
  "step_order" integer,
  "sets" integer,
  "reps" integer,
  "load_value" float,
  "load_unit" varchar
);

CREATE TABLE "workout_step_logs" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "session_step_id" integer NOT NULL,
  "performed_at" timestamp DEFAULT now(),
  "sets" integer,
  "reps" integer,
  "load_value" float,
  "load_unit" varchar
);

CREATE TABLE "muscles" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "common_name" varchar,
  "scientific_name" varchar,
  "body_region" varchar,
  "reference_url" varchar
);

CREATE TABLE "exercises_muscles" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "exercise_id" integer NOT NULL,
  "muscle_id" integer NOT NULL,
  "role" varchar
);

ALTER TABLE "programs"
ADD CONSTRAINT "programs_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "users" ("id")
DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "programs"
ADD CONSTRAINT "programs_goal_id_fkey"
FOREIGN KEY ("goal_id")
REFERENCES "goals" ("id")
DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "cycles"
ADD CONSTRAINT "cycles_program_id_fkey"
FOREIGN KEY ("program_id")
REFERENCES "programs" ("id")
DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "sessions"
ADD CONSTRAINT "sessions_cycle_id_fkey"
FOREIGN KEY ("cycle_id")
REFERENCES "cycles" ("id")
DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "exercises"
ADD CONSTRAINT "exercises_movement_pattern_id_fkey"
FOREIGN KEY ("movement_pattern_id")
REFERENCES "movement_patterns" ("id")
DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "exercise_variants"
ADD CONSTRAINT "exercise_variants_exercise_id_fkey"
FOREIGN KEY ("exercise_id")
REFERENCES "exercises" ("id")
DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "exercise_variants"
ADD CONSTRAINT "exercise_variants_equipment_id_fkey"
FOREIGN KEY ("equipment_id")
REFERENCES "equipments" ("id")
DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "session_steps"
ADD CONSTRAINT "session_steps_session_id_fkey"
FOREIGN KEY ("session_id")
REFERENCES "sessions" ("id")
DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "session_steps"
ADD CONSTRAINT "session_steps_step_type_id_fkey"
FOREIGN KEY ("step_type_id")
REFERENCES "step_types" ("id")
DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "session_steps"
ADD CONSTRAINT "session_steps_exercise_variant_id_fkey"
FOREIGN KEY ("exercise_variant_id")
REFERENCES "exercise_variants" ("id")
DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "workout_step_logs"
ADD CONSTRAINT "workout_step_logs_session_step_id_fkey"
FOREIGN KEY ("session_step_id")
REFERENCES "session_steps" ("id")
DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "exercises_muscles"
ADD CONSTRAINT "exercises_muscles_exercise_id_fkey"
FOREIGN KEY ("exercise_id")
REFERENCES "exercises" ("id")
DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "exercises_muscles"
ADD CONSTRAINT "exercises_muscles_muscle_id_fkey"
FOREIGN KEY ("muscle_id")
REFERENCES "muscles" ("id")
DEFERRABLE INITIALLY IMMEDIATE;

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

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
  cycle_order INTEGER NOT NULL,
  UNIQUE (program_id, cycle_order)
);

CREATE TABLE "sessions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "cycle_id" INTEGER NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  "name" varchar,
  "notes" text,
	"session_order" integer NOT NULL,
	UNIQUE (cycle_id, session_order)
);

CREATE TABLE "session_steps" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "session_id" integer NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  "step_type_id" integer NOT NULL,
  "exercise_variant_id" integer,
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

CREATE TABLE "exercises_muscles" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "exercise_id" integer NOT NULL,
  "muscle_id" integer NOT NULL,
  "role" varchar
);

CREATE TABLE "muscles" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "common_name" varchar,
  "scientific_name" varchar,
  "body_region" varchar,
  "reference_url" varchar
);

ALTER TABLE "programs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "programs" ADD FOREIGN KEY ("goal_id") REFERENCES "goals" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "cycles" ADD FOREIGN KEY ("program_id") REFERENCES "programs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "sessions" ADD FOREIGN KEY ("cycle_id") REFERENCES "cycles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "session_steps" ADD FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "session_steps" ADD FOREIGN KEY ("step_type_id") REFERENCES "step_types" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "session_steps" ADD FOREIGN KEY ("exercise_variant_id") REFERENCES "exercise_variants" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "workout_step_logs" ADD FOREIGN KEY ("session_step_id") REFERENCES "session_steps" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "exercise_variants" ADD FOREIGN KEY ("exercise_id") REFERENCES "exercises" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "exercise_variants" ADD FOREIGN KEY ("equipment_id") REFERENCES "equipments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "exercises" ADD FOREIGN KEY ("movement_pattern_id") REFERENCES "movement_patterns" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "exercises_muscles" ADD FOREIGN KEY ("exercise_id") REFERENCES "exercises" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "exercises_muscles" ADD FOREIGN KEY ("muscle_id") REFERENCES "muscles" ("id") DEFERRABLE INITIALLY IMMEDIATE;


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

CREATE TABLE "users" (
  "id" integer PRIMARY KEY,
  "name" varchar,
  "date_of_birth" date,
  "anamnese" text
);

CREATE TABLE "goals" (
  "id" integer PRIMARY KEY,
  "name" varchar
);

CREATE TABLE "programs" (
  "id" integer PRIMARY KEY,
  "user_id" integer NOT NULL,
  "goal_id" integer,
  "name" varchar,
  "start_date" date
);

CREATE TABLE "cycles" (
  "id" integer PRIMARY KEY,
  "program_id" integer NOT NULL,
  "name" varchar,
  "cycle_order" integer
);

CREATE TABLE "sessions" (
  "id" integer PRIMARY KEY,
  "cycle_id" integer NOT NULL,
  "name" varchar,
  "session_order" integer,
  "notes" text
);

CREATE TABLE "session_steps" (
  "id" integer PRIMARY KEY,
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
  "id" integer PRIMARY KEY,
  "session_step_id" integer NOT NULL,
  "performed_at" timestamp,
  "sets" integer,
  "reps" integer,
  "load_value" float,
  "load_unit" varchar
);

CREATE TABLE "step_types" (
  "id" integer PRIMARY KEY,
  "name" varchar
);

CREATE TABLE "exercise_variants" (
  "id" integer PRIMARY KEY,
  "exercise_id" integer NOT NULL,
  "equipment_id" integer,
  "setup_description" text,
  "environment" varchar,
  "notes" text
);

CREATE TABLE "equipments" (
  "id" integer PRIMARY KEY,
  "name" varchar,
  "category" varchar
);

CREATE TABLE "exercises" (
  "id" integer PRIMARY KEY,
  "name" varchar,
  "movement_pattern_id" integer
);

CREATE TABLE "movement_patterns" (
  "id" integer PRIMARY KEY,
  "name" varchar,
  "notes" text
);

CREATE TABLE "exercises_muscles" (
  "id" integer PRIMARY KEY,
  "exercise_id" integer NOT NULL,
  "muscle_id" integer NOT NULL,
  "role" varchar
);

CREATE TABLE "muscles" (
  "id" integer PRIMARY KEY,
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

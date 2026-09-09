import { Client } from "pg";
import { pathToFileURL } from "node:url";

import { schemaSql } from "./schema.js";
import normalizeEmail from "../src/features/auth/normalizeEmail.js";
import { hashPassword } from "../src/features/auth/passwordService.js";
import { catalogSeedSql } from "../src/features/exerciseCatalog/createCatalogSeedSql.js";

export const seedSql = `
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

${catalogSeedSql}

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

function isDisposableDatabaseTarget(connectionString) {
	try {
		const url = new URL(connectionString);
		const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
		const databaseName = url.pathname.slice(1);

		return (
			localHosts.has(url.hostname) ||
			/(?:^|[_-])(dev|development|local|test)(?:$|[_-])/.test(databaseName)
		);
	} catch {
		return false;
	}
}

export async function seedDatabase(connectionString = process.env.DATABASE_URL) {
	if (process.env.NODE_ENV === "production") {
		throw new Error("Refusing to reset the database in production");
	}
	if (process.env.ALLOW_DATABASE_RESET !== "true") {
		throw new Error("Database reset requires ALLOW_DATABASE_RESET=true");
	}
	if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
		throw new Error("Database reset requires NODE_ENV=development or NODE_ENV=test");
	}
	if (!connectionString) {
		throw new Error("DATABASE_URL is required");
	}
	if (!isDisposableDatabaseTarget(connectionString)) {
		throw new Error(
			"Refusing to reset a database that is not local or explicitly named for development/test",
		);
	}

	const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
	const adminPassword = process.env.ADMIN_PASSWORD;
	if (!adminEmail || !adminEmail.includes("@")) {
		throw new Error("ADMIN_EMAIL must be a valid email address");
	}
	if (!adminPassword) {
		throw new Error("ADMIN_PASSWORD is required");
	}

	// Validate and hash before any destructive operation begins.
	const passwordHash = await hashPassword(adminPassword);
	console.log("Resetting and seeding the development database...");

	const client = new Client({
		connectionString,
		ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : false,
	});

	try {
		await client.connect();
		await client.query("BEGIN");
		await client.query(schemaSql);
		await client.query(seedSql);
		await client.query(
			`WITH administrator AS (
				INSERT INTO users (email, role, name)
				VALUES ($1, 'admin', 'Administrator')
				RETURNING id
			)
			INSERT INTO auth_identities (user_id, provider, provider_subject, password_hash)
			SELECT id, 'local', $1, $2 FROM administrator`,
			[adminEmail, passwordHash],
		);
		await client.query("COMMIT");
		console.log("Database seeded successfully.");
	} catch (error) {
		await client.query("ROLLBACK").catch(() => {});
		console.error("Error while seeding database:", error);
		throw error;
	} finally {
		await client.end();
		console.log("Connection closed.");
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await seedDatabase();
}

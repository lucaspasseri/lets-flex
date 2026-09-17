import { Client } from "pg";
import { pathToFileURL } from "node:url";

import { schemaSql } from "./schema.js";
import normalizeEmail from "../src/features/auth/normalizeEmail.js";
import { hashPassword } from "../src/features/auth/passwordService.js";
import { catalogSeedSql } from "../src/features/exerciseCatalog/createCatalogSeedSql.js";
import { starterWorkoutSeedSql } from "../src/features/starterTraining/createStarterWorkoutSeedSql.js";
import provisionStarterTraining from "../src/features/starterTraining/provisionStarterTraining.js";
import { catalogTranslationSeedSql } from "./catalogTranslationsSql.js";
import { mediaSeedSql } from "./mediaSeedSql.js";
import {
	assertDevelopmentR2Configuration,
	createR2MediaObjectProbeFromEnvironment,
	getR2OperationDiagnostics,
} from "../src/features/media/storage/r2Storage.js";
import { createCanonicalMediaRegistryFromEnvironment } from "../src/features/media/registry/canonicalMediaRegistry.js";
import {
	CanonicalRegistryPreflightError,
	preflightCanonicalRegistry,
	restoreCanonicalRegistry,
} from "../src/features/media/registry/canonicalMediaRegistryRecovery.js";

export const PRODUCTION_DATABASE_RESET_MODE = "reset-and-restore";
export const PRODUCTION_DATABASE_RESET_AUTHORIZATION = "I_CONFIRM_PRODUCTION_DB_RESET";

export const seedSql = `
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

${catalogSeedSql}
${catalogTranslationSeedSql}
${starterWorkoutSeedSql}
${mediaSeedSql}
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

export async function seedDatabase(
	connectionString = process.env.DATABASE_URL,
	dependencies = {},
) {
	return resetAndSeedDatabase({
		connectionString,
		...dependencies,
	});
}

/**
 * Require the private production-reset capability in addition to the production reset mode. The
 * capability is checked by both the production wrapper and the reset implementation so a direct
 * call cannot bypass the explicit environment confirmation.
 *
 * @param {NodeJS.ProcessEnv} environment
 * @param {boolean} allowProductionReset
 */
export function assertProductionResetAuthorization(environment, allowProductionReset) {
	if (
		!allowProductionReset ||
		environment.PRODUCTION_DATABASE_RESET_MODE !== PRODUCTION_DATABASE_RESET_MODE ||
		environment.ALLOW_PRODUCTION_DB_RESET !== PRODUCTION_DATABASE_RESET_AUTHORIZATION
	)
		throw new Error(
			"Refusing to reset the database in production without explicit reset authorization.",
		);
}

/**
 * Rebuild and seed a database using the current authoritative schema and seed SQL. The production
 * deployment command supplies an already validated registry snapshot and the explicit production
 * authorization; the normal db:reset entry point remains development/test-only.
 *
 * @param {{connectionString?: string, environment?: NodeJS.ProcessEnv, canonicalRegistry?: import("../src/features/media/registry/canonicalMediaRegistry.js").CanonicalMediaRegistryStore, mediaStorage?: import("../src/features/media/storage/storage.js").MediaStorage, registryPreflight?: {entries: Array<import("../src/features/media/registry/canonicalMediaRegistrySchema.js").CanonicalRegistryEntry>, summary: {count: number}}, allowProductionReset?: boolean, log?: (message: string) => void}} [options]
 */
export async function resetAndSeedDatabase({
	connectionString = process.env.DATABASE_URL,
	environment = process.env,
	canonicalRegistry,
	mediaStorage,
	registryPreflight,
	allowProductionReset = false,
	log = (message) => console.log(`[database-reset] ${message}`),
} = {}) {
	if (environment.NODE_ENV === "production") {
		assertProductionResetAuthorization(environment, allowProductionReset);
	} else {
		if (environment.ALLOW_DATABASE_RESET !== "true") {
			throw new Error("Database reset requires ALLOW_DATABASE_RESET=true");
		}
		if (environment.NODE_ENV !== "development" && environment.NODE_ENV !== "test") {
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
	}
	if (!connectionString) {
		throw new Error("DATABASE_URL is required");
	}

	const adminEmail = normalizeEmail(environment.ADMIN_EMAIL);
	const adminPassword = environment.ADMIN_PASSWORD;
	if (!adminEmail || !adminEmail.includes("@")) {
		throw new Error("ADMIN_EMAIL must be a valid email address");
	}
	if (!adminPassword) {
		throw new Error("ADMIN_PASSWORD is required");
	}
	assertDevelopmentR2Configuration(environment);

	const registry =
		canonicalRegistry ?? createCanonicalMediaRegistryFromEnvironment(environment);
	const storage =
		mediaStorage ??
		createR2MediaObjectProbeFromEnvironment(environment, { throwOnMissing: true });
	let validatedRegistry = registryPreflight;
	if (!validatedRegistry) {
		try {
			validatedRegistry = await preflightCanonicalRegistry({
				registry,
				mediaStorage: storage,
			});
		} catch (error) {
			if (error instanceof CanonicalRegistryPreflightError) {
				console.error("Canonical registry preflight failed.");
				for (const issue of error.issues)
					console.error(formatCanonicalRegistryPreflightIssue(issue));
			}
			throw error;
		}
	}
	console.log(
		`Canonical registry preflight passed (${validatedRegistry.summary.count} override(s)).`,
	);

	// Validate and hash before any destructive operation begins.
	const passwordHash = await hashPassword(adminPassword);
	console.log("Resetting and seeding the database...");

	const client = new Client({
		connectionString,
		ssl: environment.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : false,
	});

	try {
		await client.connect();
		log("PostgreSQL reset transaction started");
		await client.query("BEGIN");
		await client.query(schemaSql);
		await client.query(seedSql);
		log("canonical recovery started");
		try {
			await restoreCanonicalRegistry({
				entries: validatedRegistry.entries,
				db: client,
			});
			log("canonical recovery passed");
		} catch (error) {
			log("canonical recovery failed");
			throw error;
		}
		const { rows: administratorRows } = await client.query(
			`INSERT INTO users (email, role, name)
			 VALUES ($1, 'admin', 'Administrator')
			 RETURNING id`,
			[adminEmail],
		);
		const administrator = administratorRows[0];
		await client.query(
			`INSERT INTO auth_identities (user_id, provider, provider_subject, password_hash)
			 VALUES ($1, 'local', $2, $3)`,
			[administrator.id, adminEmail, passwordHash],
		);
		await provisionStarterTraining({ userId: administrator.id }, client);
		await client.query("COMMIT");
		log("PostgreSQL reset transaction committed");
		console.log("Database seeded successfully.");
	} catch (error) {
		await client.query("ROLLBACK").catch(() => {});
		console.error("Error while seeding database.");
		throw error;
	} finally {
		await client.end();
		console.log("Connection closed.");
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		await seedDatabase();
	} catch (error) {
		if (!(error instanceof CanonicalRegistryPreflightError)) throw error;
		process.exitCode = 1;
	}
}

/** @param {{entityType?: string, entityKey?: string, objectKey?: string, reason: string, cause?: unknown}} issue @returns {string} */
function formatCanonicalRegistryPreflightIssue(issue) {
	const identity = issue.entityType
		? ` entity=${issue.entityType}${issue.entityKey ? `:${issue.entityKey}` : ""}`
		: "";
	const objectKey = issue.objectKey ? ` objectKey=${issue.objectKey}` : "";
	const diagnostics = issue.cause ? getR2OperationDiagnostics(issue.cause) : null;
	if (!diagnostics)
		return `- registry-preflight${identity}${objectKey} reason=${issue.reason}${issue.cause ? ` cause=${safePreflightMessage(issue.cause)}` : ""}`;
	const providerCode = diagnostics.providerCode
		? ` code=${diagnostics.providerCode}`
		: "";
	const status =
		diagnostics.httpStatusCode === undefined
			? ""
			: ` status=${diagnostics.httpStatusCode}`;
	const classification = diagnostics.objectMissing
		? " classification=object-missing"
		: "";
	return (
		`- registry-preflight${identity}${objectKey} reason=${issue.reason}` +
		classification +
		` operation=${diagnostics.operation} bucket=${diagnostics.bucketName}` +
		` endpoint=${diagnostics.endpointHostname}` +
		` addressing=${diagnostics.forcePathStyle ? "path-style" : "virtual-hosted"}` +
		` provider=${diagnostics.providerName}${providerCode}${status}` +
		` message=${diagnostics.providerMessage}`
	);
}

/** @param {unknown} error @returns {string} */
function safePreflightMessage(error) {
	const message = error instanceof Error ? error.message : String(error);
	return message
		.replace(/https?:\/\/[^\s]+/giu, "[url-redacted]")
		.replace(
			/(access[_-]?key|secret(?:[_-]?access[_-]?key)?|token|password)\s*[:=]\s*[^\s,;]+/giu,
			"$1=[redacted]",
		);
}

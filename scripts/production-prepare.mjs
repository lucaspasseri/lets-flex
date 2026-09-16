import process from "node:process";
import { pathToFileURL } from "node:url";

import pool from "../db/pool.js";
import {
	PRODUCTION_DATABASE_RESET_AUTHORIZATION,
	PRODUCTION_DATABASE_RESET_MODE,
	assertProductionResetAuthorization,
	resetAndSeedDatabase,
} from "../db/seed.js";
import {
	preflightCanonicalRegistry,
	verifyCanonicalRegistryRestoration,
} from "../src/features/media/registry/canonicalMediaRegistryRecovery.js";
import { createCanonicalMediaRegistryFromEnvironment } from "../src/features/media/registry/canonicalMediaRegistry.js";
import { createR2MediaStorageFromEnvironment } from "../src/features/media/storage/r2Storage.js";

export { PRODUCTION_DATABASE_RESET_AUTHORIZATION, PRODUCTION_DATABASE_RESET_MODE };

/**
 * Read the production reset mode request. Empty or missing values are safe no-ops; any non-empty
 * value other than the documented mode is a configuration error. The separate exact confirmation
 * is checked before registry preflight and destructive work.
 *
 * @param {NodeJS.ProcessEnv} [environment]
 * @returns {{enabled: boolean}}
 */
export function readProductionResetConfiguration(environment = process.env) {
	const value = environment.PRODUCTION_DATABASE_RESET_MODE;
	if (value === undefined || value === "") return { enabled: false };
	if (value !== PRODUCTION_DATABASE_RESET_MODE)
		throw new Error(
			"PRODUCTION_DATABASE_RESET_MODE must be unset or exactly reset-and-restore.",
		);
	return { enabled: true };
}

/**
 * Validate production identity and all configuration required before registry preflight. This
 * intentionally requires separate explicit registry settings so development/public-media
 * configuration cannot silently become the recovery source.
 *
 * @param {NodeJS.ProcessEnv} environment
 */
export function assertProductionPreparationSafety(environment) {
	if (environment.NODE_ENV !== "production")
		throw new Error("Production database reset requires NODE_ENV=production.");
	assertProductionResetAuthorization(environment, true);
	const databaseUrl = environment.DATABASE_URL;
	if (typeof databaseUrl !== "string" || databaseUrl.trim() === "")
		throw new Error("DATABASE_URL is required for production database reset.");
	let parsedDatabaseUrl;
	try {
		parsedDatabaseUrl = new globalThis.URL(databaseUrl);
	} catch {
		throw new Error("DATABASE_URL must be a valid PostgreSQL URL.");
	}
	if (
		!/^postgres(?:ql)?:$/u.test(parsedDatabaseUrl.protocol) ||
		!parsedDatabaseUrl.hostname
	)
		throw new Error("DATABASE_URL must be a valid PostgreSQL URL.");
	const databaseName = decodeURIComponent(parsedDatabaseUrl.pathname.slice(1));
	if (
		new Set(["localhost", "127.0.0.1", "::1"]).has(parsedDatabaseUrl.hostname) ||
		/(?:^|[_-])(dev|development|local|test|testing)(?:$|[_-])/u.test(databaseName)
	)
		throw new Error(
			"Refusing to reset a local or development-looking database target.",
		);

	if (
		typeof environment.ADMIN_EMAIL !== "string" ||
		!environment.ADMIN_EMAIL.includes("@")
	)
		throw new Error("ADMIN_EMAIL must be configured for production database reset.");
	if (
		typeof environment.ADMIN_PASSWORD !== "string" ||
		environment.ADMIN_PASSWORD === ""
	)
		throw new Error("ADMIN_PASSWORD must be configured for production database reset.");

	const requiredNames = [
		"R2_BUCKET_NAME",
		"R2_ENDPOINT",
		"R2_ACCESS_KEY_ID",
		"R2_SECRET_ACCESS_KEY",
		"R2_CANONICAL_REGISTRY_BUCKET_NAME",
		"R2_CANONICAL_REGISTRY_PREFIX",
		"R2_CANONICAL_REGISTRY_ACCESS_KEY_ID",
		"R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY",
	];
	for (const name of requiredNames) {
		if (typeof environment[name] !== "string" || environment[name].trim() === "")
			throw new Error(`${name} is required for production database reset.`);
	}
	if (environment.R2_BUCKET_NAME === environment.R2_CANONICAL_REGISTRY_BUCKET_NAME)
		throw new Error(
			"Production media and canonical registry buckets must be separate.",
		);
}

/**
 * Run the production pre-deploy lifecycle. Dependencies are injectable so all destructive
 * behavior can be tested without a real production database or R2 bucket.
 *
 * @param {{environment?: NodeJS.ProcessEnv, dependencies?: {registry?: import("../src/features/media/registry/canonicalMediaRegistry.js").CanonicalMediaRegistryStore, mediaStorage?: import("../src/features/media/storage/storage.js").MediaStorage, resetDatabase?: (options: object) => Promise<unknown>, verifyRestoration?: (input: object) => Promise<{count: number}>, db?: object}, log?: (message: string) => void}} [options]
 */
export async function prepareProductionDeployment({
	environment = process.env,
	dependencies = {},
	log = (message) => globalThis.console.log(`[production-prepare] ${message}`),
} = {}) {
	const resetRequest = readProductionResetConfiguration(environment);
	log("production preparation started");
	if (!resetRequest.enabled) {
		log("Production database reset not requested.");
		return { status: "disabled" };
	}

	assertProductionPreparationSafety(environment);
	log("destructive reset explicitly enabled");

	const registry =
		dependencies.registry ?? createCanonicalMediaRegistryFromEnvironment(environment);
	const mediaStorage =
		dependencies.mediaStorage ?? createR2MediaStorageFromEnvironment(environment);
	log("registry preflight started");
	let registrySnapshot;
	try {
		registrySnapshot = await preflightCanonicalRegistry({
			registry,
			mediaStorage,
		});
	} catch (error) {
		throw withStage(error, "registry_preflight");
	}
	log(`registry entries validated: ${registrySnapshot.summary.count}`);
	log(`media references verified: ${registrySnapshot.summary.count}`);
	log("registry preflight passed");

	log("database reset and baseline seed started");
	try {
		const reset = dependencies.resetDatabase ?? resetAndSeedDatabase;
		await reset({
			connectionString: environment.DATABASE_URL,
			environment,
			canonicalRegistry: registry,
			mediaStorage,
			registryPreflight: registrySnapshot,
			allowProductionReset: true,
		});
	} catch (error) {
		throw withStage(error, "database_reset");
	}
	log("baseline seed and validated registry restoration completed");

	log("post-restore verification started");
	try {
		const verify = dependencies.verifyRestoration ?? verifyCanonicalRegistryRestoration;
		const result = await verify({
			entries: registrySnapshot.entries,
			db: dependencies.db ?? pool,
		});
		log(`post-restore verification passed: ${result.count} override(s)`);
	} catch (error) {
		throw withStage(error, "post_restore_verification");
	}
	log("production preparation completed");
	return { status: "completed", count: registrySnapshot.summary.count };
}

/** @param {unknown} error @param {string} stage @returns {Error & {stage: string}} */
function withStage(error, stage) {
	const staged =
		error instanceof Error ? error : new Error("Production preparation failed.");
	staged.stage = stage;
	return staged;
}

/** @returns {Promise<void>} */
async function main() {
	try {
		await prepareProductionDeployment();
	} catch (error) {
		const stage =
			error && typeof error === "object" && "stage" in error
				? /** @type {{stage?: string}} */ (error).stage
				: "configuration";
		globalThis.console.error(`[production-prepare] ${stage} failed.`);
		process.exitCode = 1;
	} finally {
		await pool.end();
	}
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
	await main();

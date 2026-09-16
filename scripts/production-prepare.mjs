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
import {
	createR2MediaStorageFromEnvironment,
	readR2Configuration,
} from "../src/features/media/storage/r2Storage.js";
import { readCanonicalRegistryConfiguration } from "../src/features/media/registry/r2CanonicalMediaRegistry.js";

export { PRODUCTION_DATABASE_RESET_AUTHORIZATION, PRODUCTION_DATABASE_RESET_MODE };

export class ProductionPreparationConfigurationError extends Error {
	/** @param {string[]} issues */
	constructor(issues) {
		super(issues.join("; "));
		this.name = "ProductionPreparationConfigurationError";
		this.issues = issues;
		this.stage = "configuration";
	}
}

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
		throw new ProductionPreparationConfigurationError([
			"PRODUCTION_DATABASE_RESET_MODE must be unset or exactly reset-and-restore.",
		]);
	return { enabled: true };
}

/**
 * Validate production identity and every configuration value needed by the reset path. The
 * validation is intentionally side-effect free and reports all detected issues without values.
 *
 * @param {NodeJS.ProcessEnv} environment
 */
export function assertProductionPreparationSafety(environment) {
	const issues = [];
	if (environment.NODE_ENV !== "production")
		issues.push("Production database reset requires NODE_ENV=production.");

	try {
		assertProductionResetAuthorization(environment, true);
	} catch {
		issues.push("explicit reset authorization is required.");
	}

	const databaseUrl = environment.DATABASE_URL;
	if (typeof databaseUrl !== "string" || databaseUrl.trim() === "") {
		issues.push("DATABASE_URL is required for production database reset.");
	} else {
		let parsedDatabaseUrl;
		try {
			parsedDatabaseUrl = new globalThis.URL(databaseUrl);
			if (
				!/^postgres(?:ql)?:$/u.test(parsedDatabaseUrl.protocol) ||
				!parsedDatabaseUrl.hostname
			)
				throw new Error("invalid protocol or hostname");
			const databaseName = decodeURIComponent(parsedDatabaseUrl.pathname.slice(1));
			if (
				new Set(["localhost", "127.0.0.1", "::1"]).has(parsedDatabaseUrl.hostname) ||
				/(?:^|[_-])(dev|development|local|test|testing)(?:$|[_-])/u.test(databaseName)
			)
				issues.push("DATABASE_URL targets a local or development-looking database.");
		} catch {
			issues.push("DATABASE_URL must be a valid PostgreSQL URL.");
		}
	}

	if (
		typeof environment.ADMIN_EMAIL !== "string" ||
		!environment.ADMIN_EMAIL.includes("@")
	)
		issues.push("ADMIN_EMAIL must be configured for production database reset.");
	if (
		typeof environment.ADMIN_PASSWORD !== "string" ||
		environment.ADMIN_PASSWORD === ""
	)
		issues.push("ADMIN_PASSWORD must be configured for production database reset.");

	for (const readConfiguration of [
		() => readR2Configuration(environment),
		() => readCanonicalRegistryConfiguration(environment),
	]) {
		try {
			readConfiguration();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "invalid R2 configuration";
			if (!issues.includes(message)) issues.push(message);
		}
	}

	if (
		typeof environment.R2_BUCKET_NAME === "string" &&
		typeof environment.R2_CANONICAL_REGISTRY_BUCKET_NAME === "string" &&
		environment.R2_BUCKET_NAME.trim() !== "" &&
		environment.R2_BUCKET_NAME === environment.R2_CANONICAL_REGISTRY_BUCKET_NAME
	)
		issues.push("Production media and canonical registry buckets must be separate.");

	if (issues.length > 0) throw new ProductionPreparationConfigurationError(issues);
}

/**
 * Return the safe diagnostic used by the command-line entry point. Configuration errors carry
 * only key names and validation reasons; staged operational errors retain their generic stage.
 *
 * @param {unknown} error
 * @returns {string | null}
 */
export function getProductionPreparationDiagnostic(error) {
	if (error instanceof ProductionPreparationConfigurationError)
		return error.issues.join("; ");
	return null;
}

/** @param {unknown} error @returns {string} */
export function formatProductionPreparationFailure(error) {
	const stage =
		error && typeof error === "object" && "stage" in error
			? /** @type {{stage?: string}} */ (error).stage
			: "configuration";
	const diagnostic = getProductionPreparationDiagnostic(error);
	return `[production-prepare] ${stage} failed${diagnostic ? `: ${diagnostic}` : "."}`;
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
	log("production preparation started");
	let resetRequest;
	try {
		resetRequest = readProductionResetConfiguration(environment);
		log(
			`reset mode detected: ${resetRequest.enabled ? PRODUCTION_DATABASE_RESET_MODE : "disabled"}`,
		);
	} catch (error) {
		log("reset mode detected: invalid");
		log("authorization rejected");
		throw error;
	}
	if (!resetRequest.enabled) {
		log("authorization rejected: reset mode is disabled");
		log("Production database reset not requested.");
		return { status: "disabled" };
	}

	if (
		environment.PRODUCTION_DATABASE_RESET_MODE === PRODUCTION_DATABASE_RESET_MODE &&
		environment.ALLOW_PRODUCTION_DB_RESET === PRODUCTION_DATABASE_RESET_AUTHORIZATION
	)
		log("authorization accepted");
	else log("authorization rejected");

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
		log("canonical registry preflight failed");
		throw withStage(error, "registry_preflight");
	}
	log(`registry entries validated: ${registrySnapshot.summary.count}`);
	log(`media references verified: ${registrySnapshot.summary.count}`);
	log("canonical registry preflight passed");

	log("PostgreSQL reset started");
	try {
		const reset = dependencies.resetDatabase ?? resetAndSeedDatabase;
		await reset({
			connectionString: environment.DATABASE_URL,
			environment,
			canonicalRegistry: registry,
			mediaStorage,
			registryPreflight: registrySnapshot,
			allowProductionReset: true,
			log,
		});
	} catch (error) {
		log("PostgreSQL reset failed");
		throw withStage(error, "database_reset");
	}
	log("PostgreSQL reset passed");
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
		globalThis.console.error(formatProductionPreparationFailure(error));
		process.exitCode = 1;
	} finally {
		await pool.end();
	}
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
	await main();

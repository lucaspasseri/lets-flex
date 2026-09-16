import process from "node:process";
import { pathToFileURL } from "node:url";

import pool from "../db/pool.js";
import { resetAndSeedDatabase } from "../db/seed.js";
import { verifyCanonicalRegistryRestoration } from "../src/features/media/registry/canonicalMediaRegistryRecovery.js";
import { preflightCanonicalMediaDurability } from "../src/features/media/registry/canonicalMediaDurabilityPreflight.js";
import { createCanonicalMediaRegistryFromEnvironment } from "../src/features/media/registry/canonicalMediaRegistry.js";
import { createR2MediaObjectProbeFromEnvironment } from "../src/features/media/storage/r2Storage.js";

/**
 * Rehearse database reconstruction against a disposable PostgreSQL target. Production R2 is
 * accessed only through the read-only durability preflight; the validated registry snapshot is
 * then materialized into the disposable database and checked without further R2 writes.
 *
 * @param {{environment?: NodeJS.ProcessEnv, dependencies?: {registry?: object, mediaStorage?: object, resetDatabase?: (options: object) => Promise<unknown>, verifyRestoration?: (input: object) => Promise<{count: number}>, db?: object}, log?: (message: string) => void}} [options]
 * @returns {Promise<{status: "passed", baselineCount: number, registryCount: number, assignmentCount: number, restoredRegistryCount: number}>}
 */
export async function runCanonicalMediaRecoveryRehearsal({
	environment = process.env,
	dependencies = {},
	log = (message) =>
		globalThis.console.log(`[canonical-media-recovery-rehearsal] ${message}`),
} = {}) {
	const registry =
		dependencies.registry ?? createCanonicalMediaRegistryFromEnvironment(environment);
	const mediaStorage =
		dependencies.mediaStorage ?? createR2MediaObjectProbeFromEnvironment(environment);

	log("read-only production R2 durability preflight started");
	const preflight = await preflightCanonicalMediaDurability({
		registry,
		mediaStorage: /** @type {any} */ (mediaStorage),
	});
	log(
		`read-only preflight passed: ${preflight.summary.baselineCount} baseline object(s), ${preflight.summary.registryCount} registry override(s)`,
	);

	const reset = dependencies.resetDatabase ?? resetAndSeedDatabase;
	await reset({
		connectionString: environment.DATABASE_URL,
		environment,
		canonicalRegistry: registry,
		mediaStorage: /** @type {any} */ (mediaStorage),
		registryPreflight: {
			entries: preflight.registryEntries,
			summary: { count: preflight.registryEntries.length },
		},
	});
	log("disposable PostgreSQL schema, baseline seed, and registry snapshot restored");

	const verify = dependencies.verifyRestoration ?? verifyCanonicalRegistryRestoration;
	const restored = await verify({
		entries: preflight.registryEntries,
		db: dependencies.db ?? pool,
	});
	log(
		`strict post-restore verification passed: ${restored.count} registry override(s)`,
	);

	return {
		status: "passed",
		...preflight.summary,
		restoredRegistryCount: restored.count,
	};
}

async function main() {
	try {
		await runCanonicalMediaRecoveryRehearsal();
	} catch (error) {
		globalThis.console.error(
			`[canonical-media-recovery-rehearsal] failed: ${safeMessage(error)}`,
		);
		process.exitCode = 1;
	} finally {
		await pool.end();
	}
}

/** @param {unknown} error @returns {string} */
function safeMessage(error) {
	const message = error instanceof Error ? error.message : String(error);
	return message
		.replace(/https?:\/\/[^\s]+/giu, "[url-redacted]")
		.replace(
			/(access[_-]?key|secret(?:[_-]?access[_-]?key)?|token|password)\s*[:=]\s*[^\s,;]+/giu,
			"$1=[redacted]",
		);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
	await main();

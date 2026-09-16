import process from "node:process";
import { pathToFileURL } from "node:url";

import {
	CanonicalMediaDurabilityPreflightError,
	preflightCanonicalMediaDurability,
} from "../src/features/media/registry/canonicalMediaDurabilityPreflight.js";
import { createCanonicalMediaRegistryFromEnvironment } from "../src/features/media/registry/canonicalMediaRegistry.js";
import { createR2MediaObjectProbeFromEnvironment } from "../src/features/media/storage/r2Storage.js";

/**
 * Run the complete read-only canonical-media durability gate. It checks repository baseline
 * entries and private registry overrides against the production media bucket and never queries
 * PostgreSQL or writes either R2 bucket.
 *
 * @param {{environment?: NodeJS.ProcessEnv, dependencies?: {registry?: object, mediaStorage?: {exists: (storageKey: string) => Promise<boolean>}}, log?: (message: string) => void}} [options]
 * @returns {Promise<{status: "passed", baselineCount: number, registryCount: number, assignmentCount: number}>}
 */
export async function runCanonicalMediaDurabilityPreflight({
	environment = process.env,
	dependencies = {},
	log = (message) =>
		globalThis.console.log(`[canonical-media-durability-preflight] ${message}`),
} = {}) {
	const registry =
		dependencies.registry ?? createCanonicalMediaRegistryFromEnvironment(environment);
	const mediaStorage =
		dependencies.mediaStorage ?? createR2MediaObjectProbeFromEnvironment(environment);
	const result = await preflightCanonicalMediaDurability({
		registry,
		mediaStorage,
	});
	log(
		`passed: ${result.summary.baselineCount} baseline entr${result.summary.baselineCount === 1 ? "y" : "ies"}, ${result.summary.registryCount} registry override${result.summary.registryCount === 1 ? "" : "s"}; ${result.summary.assignmentCount} durable assignment source${result.summary.assignmentCount === 1 ? "" : "s"}`,
	);
	return { status: "passed", ...result.summary };
}

async function main() {
	try {
		await runCanonicalMediaDurabilityPreflight();
	} catch (error) {
		globalThis.console.error("[canonical-media-durability-preflight] failed.");
		if (error instanceof CanonicalMediaDurabilityPreflightError)
			for (const issue of error.issues)
				globalThis.console.error(
					`- ${issue.scope}: ${issue.entityType ?? "manifest"}${issue.entityKey ? `:${issue.entityKey}` : ""}${issue.objectKey ? ` (${issue.objectKey})` : ""}: ${issue.reason}`,
				);
		process.exitCode = 1;
	}
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
	await main();

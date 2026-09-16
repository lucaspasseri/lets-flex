import process from "node:process";
import { pathToFileURL } from "node:url";

import { preflightCanonicalRegistry } from "../src/features/media/registry/canonicalMediaRegistryPreflight.js";
import { createCanonicalMediaRegistryFromEnvironment } from "../src/features/media/registry/canonicalMediaRegistry.js";
import { createR2MediaObjectProbeFromEnvironment } from "../src/features/media/storage/r2Storage.js";

/**
 * Run the read-only canonical registry validation used by the production deployment gate.
 * PostgreSQL, public media URL configuration, and the runtime storage-provider selector are not
 * part of this command's dependency boundary.
 *
 * @param {{environment?: NodeJS.ProcessEnv, dependencies?: {registry?: object, mediaStorage?: {exists: (storageKey: string) => Promise<boolean>}}, log?: (message: string) => void}} [options]
 * @returns {Promise<{status: "passed", count: number}>}
 */
export async function runCanonicalRegistryPreflight({
	environment = process.env,
	dependencies = {},
	log = (message) =>
		globalThis.console.log(`[canonical-registry-preflight] ${message}`),
} = {}) {
	const registry =
		dependencies.registry ?? createCanonicalMediaRegistryFromEnvironment(environment);
	const mediaStorage =
		dependencies.mediaStorage ?? createR2MediaObjectProbeFromEnvironment(environment);
	const snapshot = await preflightCanonicalRegistry({ registry, mediaStorage });
	log(
		`passed: ${snapshot.summary.count} canonical registry entr${snapshot.summary.count === 1 ? "y" : "ies"}`,
	);
	return { status: "passed", count: snapshot.summary.count };
}

async function main() {
	try {
		await runCanonicalRegistryPreflight();
	} catch (error) {
		globalThis.console.error("[canonical-registry-preflight] failed.");
		if (error instanceof Error && "issues" in error) {
			const issues = /** @type {{issues?: Array<{reason?: string}>}} */ (error).issues;
			if (Array.isArray(issues))
				for (const issue of issues)
					globalThis.console.error(`- ${issue.reason ?? "validation issue"}`);
		}
		process.exitCode = 1;
	}
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
	await main();

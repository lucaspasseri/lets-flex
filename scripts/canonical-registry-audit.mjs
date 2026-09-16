import process from "node:process";
import { pathToFileURL } from "node:url";

import pool from "../db/pool.js";
import { auditCanonicalRegistry } from "../src/features/media/registry/canonicalMediaRegistryAudit.js";
import { createCanonicalMediaRegistryFromEnvironment } from "../src/features/media/registry/canonicalMediaRegistry.js";
import { createR2MediaStorageFromEnvironment } from "../src/features/media/storage/r2Storage.js";

/**
 * Render read-only audit results without exposing registry payloads or credentials.
 *
 * @param {{reports: Array<{status: "OK" | "WARNING" | "ERROR", entry: {entityType: string, entityKey: string}, issues: string[]}>, summary: {ok: number, warning: number, error: number}}} result
 * @returns {string}
 */
export function formatCanonicalRegistryAudit(result) {
	const lines = [];
	for (const report of result.reports) {
		lines.push(
			`${report.status.padEnd(7)} ${report.entry.entityType}/${report.entry.entityKey}`,
		);
		if (report.issues.length === 0)
			lines.push(
				"        registry, R2 object, catalog, and DB canonical assignment agree",
			);
		else for (const issue of report.issues) lines.push(`        ${issue}`);
	}
	if (result.reports.length === 0)
		lines.push("OK      no canonical registry overrides found");
	lines.push(
		`Summary: ${result.summary.ok} OK, ${result.summary.warning} WARNING, ${result.summary.error} ERROR`,
	);
	return `${lines.join("\n")}\n`;
}

/** @returns {Promise<void>} */
async function main() {
	try {
		const result = await auditCanonicalRegistry({
			registry: createCanonicalMediaRegistryFromEnvironment(),
			mediaStorage: createR2MediaStorageFromEnvironment(),
			db: pool,
		});
		process.stdout.write(formatCanonicalRegistryAudit(result));
		if (result.summary.error > 0) process.exitCode = 1;
	} finally {
		await pool.end();
	}
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
	await main();

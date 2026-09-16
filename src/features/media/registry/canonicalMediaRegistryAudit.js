import { findCanonicalMediaStateByKey } from "../mediaRepository.js";
import { validateCanonicalRegistryEntry } from "./canonicalMediaRegistrySchema.js";

/** @typedef {import("./canonicalMediaRegistry.js").CanonicalMediaRegistryStore} CanonicalMediaRegistry */
/** @typedef {import("../storage/storage.js").MediaStorage} MediaStorage */
/** @typedef {import("pg").Pool | Pick<import("pg").PoolClient, "query">} DatabaseClient */

/**
 * Compare durable registry overrides with their R2 object, seeded catalog entity, and current
 * PostgreSQL assignment. This function is read-only: it performs no writes or cleanup.
 *
 * @param {{registry: CanonicalMediaRegistry, mediaStorage: Pick<MediaStorage, "exists">, db: DatabaseClient}} dependencies
 * @returns {Promise<{reports: Array<CanonicalRegistryAuditReport>, summary: {ok: number, warning: number, error: number}}>}
 */
export async function auditCanonicalRegistry({ registry, mediaStorage, db }) {
	const durableEntries = await registry.listCanonicalOverrides();
	const reports = [];
	for (const result of durableEntries) {
		const entry = validateCanonicalRegistryEntry(result.entry);
		const issues = [];
		let objectState = "ok";
		try {
			if (!(await mediaStorage.exists(entry.asset.objectKey))) {
				objectState = "missing";
				issues.push(`registry references missing R2 object ${entry.asset.objectKey}`);
			}
		} catch {
			objectState = "unavailable";
			issues.push(`R2 object ${entry.asset.objectKey} could not be verified`);
		}

		const databaseState = await findCanonicalMediaStateByKey(
			{ entityType: entry.entityType, entityKey: entry.entityKey },
			db,
		);
		if (!databaseState) {
			issues.push("catalog entity is missing from the current database");
		} else if (!databaseState.media_asset_id) {
			issues.push("database has no canonical media assignment");
		} else {
			compareDatabaseState(databaseState, entry, issues);
		}
		reports.push({
			status:
				issues.some((issue) => issue.startsWith("registry references missing")) ||
				issues.some((issue) => issue.includes("could not be verified")) ||
				issues.some((issue) => issue.includes("catalog entity is missing"))
					? "ERROR"
					: issues.length > 0
						? "WARNING"
						: "OK",
			entry,
			objectState,
			issues,
		});
	}
	const summary = {
		ok: reports.filter((report) => report.status === "OK").length,
		warning: reports.filter((report) => report.status === "WARNING").length,
		error: reports.filter((report) => report.status === "ERROR").length,
	};
	return { reports, summary };
}

/**
 * @param {Record<string, any>} databaseState
 * @param {import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry} entry
 * @param {string[]} issues
 */
function compareDatabaseState(databaseState, entry, issues) {
	const checks = [
		["storage key", databaseState.storage_key, entry.asset.objectKey],
		["canonical path", databaseState.canonical_path, entry.canonicalPath],
		["MIME type", databaseState.mime_type, entry.asset.mimeType],
		["width", databaseState.width, entry.asset.width],
		["height", databaseState.height, entry.asset.height],
		["English alt text", databaseState.alt_text_en, entry.alt.en],
		["Brazilian Portuguese alt text", databaseState.alt_text_pt_br, entry.alt["pt-BR"]],
	];
	for (const [label, actual, expected] of checks) {
		if (actual !== expected)
			issues.push(`database ${label} differs from durable registry`);
	}
}

/** @typedef {object} CanonicalRegistryAuditReport
 * @property {"OK" | "WARNING" | "ERROR"} status
 * @property {import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry} entry
 * @property {"ok" | "missing" | "unavailable"} objectState
 * @property {string[]} issues
 */

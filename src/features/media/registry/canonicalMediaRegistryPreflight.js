import {
	catalogManifest,
	catalogVocabulary,
} from "../../exerciseCatalog/catalogManifest.js";
import { validateCanonicalRegistryEntry } from "./canonicalMediaRegistrySchema.js";

/** @typedef {import("./canonicalMediaRegistry.js").CanonicalMediaRegistryStore} CanonicalMediaRegistry */
/** @typedef {import("../storage/storage.js").MediaStorage} MediaStorage */

const catalogDefinitions = Object.freeze({
	exercise: new Set(catalogManifest.map((entry) => entry.catalogKey)),
	exercise_variant: new Set(
		catalogManifest.flatMap((entry) =>
			entry.variants.map((variant) => variant.catalogKey),
		),
	),
	muscle: new Set(
		catalogVocabulary.catalogEntries.muscles.map((entry) => entry.catalogKey),
	),
	equipment: new Set(
		catalogVocabulary.catalogEntries.equipment.map((entry) => entry.catalogKey),
	),
	movement_pattern: new Set(
		catalogVocabulary.catalogEntries.movementPatterns.map((entry) => entry.catalogKey),
	),
});

export class CanonicalRegistryPreflightError extends Error {
	/** @param {Array<{entityType?: string, entityKey?: string, objectKey?: string, reason: string, cause?: unknown}>} issues */
	constructor(issues) {
		super(`Canonical registry preflight failed with ${issues.length} issue(s).`);
		this.name = "CanonicalRegistryPreflightError";
		this.issues = issues;
	}
}

/**
 * Validate all durable overrides before any resettable database operation. The catalog index is
 * derived from the same source files used to generate the normal seed, not from PostgreSQL.
 *
 * @param {{registry: CanonicalMediaRegistry, mediaStorage: Pick<MediaStorage, "exists">}} dependencies
 * @returns {Promise<{entries: Array<import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry>, summary: {count: number}}>}
 */
export async function preflightCanonicalRegistry({ registry, mediaStorage }) {
	const issues = [];
	let results;
	try {
		results = await registry.listCanonicalOverrides();
	} catch (error) {
		throw new CanonicalRegistryPreflightError([
			{ reason: "registry could not be read", cause: error },
		]);
	}

	const identities = new Set();
	const entries = [];
	for (const result of results) {
		let entry;
		try {
			entry = validateCanonicalRegistryEntry(result.entry);
		} catch {
			issues.push({ reason: "registry entry is malformed" });
			continue;
		}
		const identity = `${entry.entityType}:${entry.entityKey}`;
		if (identities.has(identity)) {
			issues.push({
				entityType: entry.entityType,
				entityKey: entry.entityKey,
				reason: "duplicate registry identity",
			});
			continue;
		}
		identities.add(identity);
		if (!catalogDefinitions[entry.entityType]?.has(entry.entityKey)) {
			issues.push({
				entityType: entry.entityType,
				entityKey: entry.entityKey,
				reason: "stable catalog key is absent from the reset seed",
			});
		}
		try {
			if (!(await mediaStorage.exists(entry.asset.objectKey)))
				issues.push({
					entityType: entry.entityType,
					entityKey: entry.entityKey,
					objectKey: entry.asset.objectKey,
					reason: "referenced R2 media object is missing",
				});
		} catch (error) {
			issues.push(
				isMissingObjectProbeError(error)
					? {
							entityType: entry.entityType,
							entityKey: entry.entityKey,
							objectKey: entry.asset.objectKey,
							reason: "referenced R2 media object is missing",
							cause: error,
						}
					: {
							entityType: entry.entityType,
							entityKey: entry.entityKey,
							objectKey: entry.asset.objectKey,
							reason: "referenced R2 media object could not be verified",
							cause: error,
						},
			);
		}
		entries.push(entry);
	}
	if (issues.length > 0) throw new CanonicalRegistryPreflightError(issues);
	return { entries, summary: { count: entries.length } };
}

/** @param {unknown} error @returns {boolean} */
function isMissingObjectProbeError(error) {
	return (
		typeof error === "object" &&
		error !== null &&
		"objectMissing" in error &&
		error.objectMissing === true
	);
}

/** @returns {Readonly<Record<string, ReadonlySet<string>>>} */
export function getResetCatalogDefinitions() {
	return catalogDefinitions;
}

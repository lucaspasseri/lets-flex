import { canonicalMediaManifest } from "../mediaManifest.js";
import { validateCanonicalMediaManifest } from "../../../../db/mediaSeedSql.js";
import {
	CanonicalRegistryPreflightError,
	getResetCatalogDefinitions,
	preflightCanonicalRegistry,
} from "./canonicalMediaRegistryPreflight.js";

/** @typedef {import("./canonicalMediaRegistry.js").CanonicalMediaRegistryStore} CanonicalMediaRegistry */
/** @typedef {import("../storage/storage.js").MediaStorage} MediaStorage */
/** @typedef {import("../media.types.js").CanonicalMediaManifestEntry} CanonicalMediaManifestEntry */

export class CanonicalMediaDurabilityPreflightError extends Error {
	/** @param {Array<{scope: "baseline" | "registry", entityType?: string, entityKey?: string, objectKey?: string, reason: string, cause?: unknown}>} issues */
	constructor(issues) {
		super(
			`Canonical media durability preflight failed with ${issues.length} issue(s).`,
		);
		this.name = "CanonicalMediaDurabilityPreflightError";
		this.issues = issues;
	}
}

/**
 * Validate every repository baseline and every durable Admin override without PostgreSQL or
 * writes. The manifest validator remains the seed authority; this boundary adds catalog and
 * production-object checks so local source-file presence alone cannot make a baseline ready.
 *
 * @param {{manifest?: ReadonlyArray<CanonicalMediaManifestEntry>, registry: CanonicalMediaRegistry, mediaStorage: Pick<MediaStorage, "exists">}} dependencies
 * @returns {Promise<{baselineEntries: ReadonlyArray<CanonicalMediaManifestEntry>, registryEntries: Array<import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry>, summary: {baselineCount: number, registryCount: number, assignmentCount: number}}>}
 */
export async function preflightCanonicalMediaDurability({
	manifest = canonicalMediaManifest,
	registry,
	mediaStorage,
}) {
	const issues = [];
	let baselineEntries = /** @type {ReadonlyArray<CanonicalMediaManifestEntry>} */ ([]);
	try {
		baselineEntries = validateCanonicalMediaManifest(manifest);
	} catch (error) {
		issues.push({
			scope: "baseline",
			reason: error instanceof Error ? error.message : "manifest is invalid",
		});
	}

	if (issues.length === 0) {
		const catalogDefinitions = getResetCatalogDefinitions();
		for (const entry of baselineEntries) {
			if (!catalogDefinitions[entry.entityType]?.has(entry.entityKey)) {
				issues.push({
					scope: "baseline",
					entityType: entry.entityType,
					entityKey: entry.entityKey,
					reason: "stable catalog key is absent from the reset seed",
				});
				continue;
			}
			try {
				if (!(await mediaStorage.exists(entry.storageKey)))
					issues.push({
						scope: "baseline",
						entityType: entry.entityType,
						entityKey: entry.entityKey,
						objectKey: entry.storageKey,
						reason: "referenced production R2 media object is missing",
					});
			} catch (error) {
				issues.push({
					scope: "baseline",
					entityType: entry.entityType,
					entityKey: entry.entityKey,
					objectKey: entry.storageKey,
					reason: "referenced production R2 media object could not be verified",
					cause: error,
				});
			}
		}
	}

	let registryEntries = [];
	try {
		const registrySnapshot = await preflightCanonicalRegistry({
			registry,
			mediaStorage,
		});
		registryEntries = registrySnapshot.entries;
	} catch (error) {
		if (error instanceof CanonicalRegistryPreflightError) {
			issues.push(...error.issues.map((issue) => ({ scope: "registry", ...issue })));
		} else {
			issues.push({
				scope: "registry",
				reason: "canonical registry preflight could not be completed",
				cause: error,
			});
		}
	}

	if (issues.length > 0) throw new CanonicalMediaDurabilityPreflightError(issues);

	return {
		baselineEntries,
		registryEntries,
		summary: {
			baselineCount: baselineEntries.length,
			registryCount: registryEntries.length,
			assignmentCount: baselineEntries.length + registryEntries.length,
		},
	};
}

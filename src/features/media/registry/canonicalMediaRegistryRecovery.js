import {
	findMediaEntityCatalogRecordByKey,
	findCanonicalMediaStateByKey,
	upsertCanonicalMediaAsset,
	replaceMediaAssetAltTexts,
	assignPrimaryMedia,
} from "../mediaRepository.js";
import { CanonicalRegistryPreflightError } from "./canonicalMediaRegistryPreflight.js";

export {
	CanonicalRegistryPreflightError,
	getResetCatalogDefinitions,
	preflightCanonicalRegistry,
} from "./canonicalMediaRegistryPreflight.js";

/** @typedef {import("./canonicalMediaRegistry.js").CanonicalMediaRegistryStore} CanonicalMediaRegistry */
/** @typedef {import("../storage/storage.js").MediaStorage} MediaStorage */
/** @typedef {import("pg").Pool | Pick<import("pg").PoolClient, "query">} DatabaseClient */

/**
 * Materialize validated persistent overrides after schema and normal seed SQL have run. Every
 * lookup uses a stable catalog key; all writes use the caller's reset transaction.
 *
 * @param {{entries: Array<import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry>, db: DatabaseClient}} input
 */
export async function restoreCanonicalRegistry({ entries, db }) {
	for (const entry of entries) {
		const entity = await findMediaEntityCatalogRecordByKey(
			{ entityType: entry.entityType, entityKey: entry.entityKey },
			db,
		);
		if (!entity)
			throw new CanonicalRegistryPreflightError([
				{
					entityType: entry.entityType,
					entityKey: entry.entityKey,
					reason: "stable catalog key could not be materialized after seed",
				},
			]);
		const asset = await upsertCanonicalMediaAsset(
			{
				storageKey: entry.asset.objectKey,
				mimeType: entry.asset.mimeType,
				width: entry.asset.width,
				height: entry.asset.height,
				source: "canonical-registry",
			},
			db,
		);
		if (!asset)
			throw new Error("Canonical registry media asset could not be materialized.");
		await replaceMediaAssetAltTexts(
			{ mediaAssetId: asset.id, altTexts: entry.alt },
			db,
		);
		const assignment = await assignPrimaryMedia(
			{
				mediaAssetId: asset.id,
				entityType: entry.entityType,
				entityId: entity.id,
				canonicalPath: entry.canonicalPath,
			},
			db,
		);
		if (!assignment)
			throw new Error(
				"Canonical registry entity assignment could not be materialized.",
			);
	}
	return { count: entries.length };
}

export class CanonicalRegistryVerificationError extends Error {
	/** @param {Array<{entityType?: string, entityKey?: string, reason: string}>} issues */
	constructor(issues) {
		super(
			`Canonical registry restoration verification failed with ${issues.length} issue(s).`,
		);
		this.name = "CanonicalRegistryVerificationError";
		this.issues = issues;
	}
}

/**
 * Verify the materialized database state against the exact in-memory registry snapshot used for
 * restoration. This is deliberately read-only and strict: a missing or mismatched assignment is
 * a failed deployment rather than an audit warning.
 *
 * @param {{entries: Array<import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry>, db: DatabaseClient}} input
 */
export async function verifyCanonicalRegistryRestoration({ entries, db }) {
	const issues = [];
	for (const entry of entries) {
		const state = await findCanonicalMediaStateByKey(
			{ entityType: entry.entityType, entityKey: entry.entityKey },
			db,
		);
		if (!state) {
			issues.push({
				entityType: entry.entityType,
				entityKey: entry.entityKey,
				reason: "catalog entity or canonical assignment is missing after restoration",
			});
			continue;
		}
		const expected = {
			storage_key: entry.asset.objectKey,
			canonical_path: entry.canonicalPath,
			mime_type: entry.asset.mimeType,
			width: entry.asset.width,
			height: entry.asset.height,
			alt_text_en: entry.alt.en,
			alt_text_pt_br: entry.alt["pt-BR"],
		};
		for (const [field, value] of Object.entries(expected)) {
			if (state[field] !== value) {
				issues.push({
					entityType: entry.entityType,
					entityKey: entry.entityKey,
					reason: `${field} does not match the validated registry entry`,
				});
			}
		}
	}
	if (issues.length > 0) throw new CanonicalRegistryVerificationError(issues);
	return { count: entries.length };
}

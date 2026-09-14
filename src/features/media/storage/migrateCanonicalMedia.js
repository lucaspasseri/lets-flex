import { readFile } from "node:fs/promises";
import path from "node:path";

import {
	createPublicMediaObjectKey,
	legacyMediaPathToObjectKey,
	normalizeMediaObjectKey,
} from "./mediaObjectKey.js";

/**
 * The deliberately narrower byte-operation boundary used by the one-time/re-runnable
 * development import. It accepts an explicit key so a retry can repair a partially completed
 * object without creating another object.
 *
 * @typedef {object} MediaMigrationStorage
 * @property {(buffer: Buffer, options: {storageKey: string, contentType: string}) => Promise<void>} put
 * @property {(storageKey: string) => Promise<void>} delete
 * @property {(storageKey: string) => Promise<boolean>} exists
 * @property {(storageKey: string) => Promise<Buffer>} read
 */

const MIME_EXTENSIONS = Object.freeze({
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
	"image/svg+xml": "svg",
});

/**
 * Import every canonical local source into remote storage and persist its object key in the same
 * durable manifest. Local `path` values are intentionally left unchanged for current fallback and
 * seed behavior; switching reads is a later action.
 *
 * @param {{manifestStore: {read: () => Promise<ReadonlyArray<import("../media.types.js").CanonicalMediaManifestEntry>>, update: (update: (manifest: ReadonlyArray<import("../media.types.js").CanonicalMediaManifestEntry>) => ReadonlyArray<import("../media.types.js").CanonicalMediaManifestEntry> | Promise<ReadonlyArray<import("../media.types.js").CanonicalMediaManifestEntry>>) => Promise<unknown>}, storage: MediaMigrationStorage, publicDirectory: string}} options
 * @returns {Promise<{total: number, uploaded: number, reused: number}>}
 */
export async function migrateCanonicalMedia({
	manifestStore,
	storage,
	publicDirectory,
}) {
	const manifest = await manifestStore.read();
	const preparedEntries = await preflightManifest(manifest, publicDirectory);
	const seenStorageKeys = new Map();
	for (const prepared of preparedEntries) {
		if (seenStorageKeys.has(prepared.storageKey)) {
			throw new Error(
				`Canonical media migration found duplicate object key ${prepared.storageKey} for ${prepared.label} and ${seenStorageKeys.get(prepared.storageKey)}.`,
			);
		}
		seenStorageKeys.set(prepared.storageKey, prepared.label);
	}

	let uploaded = 0;
	let reused = 0;
	for (const prepared of preparedEntries) {
		const alreadyExists = await storage.exists(prepared.storageKey);
		if (alreadyExists) {
			await assertMatchingRemoteBytes(storage, prepared);
			reused += 1;
			continue;
		}

		let uploadedKey = prepared.storageKey;
		try {
			await storage.put(prepared.bytes, {
				storageKey: prepared.storageKey,
				contentType: prepared.mimeType,
			});
			uploaded += 1;
			await assertMatchingRemoteBytes(storage, prepared);
			if (!prepared.hasStorageKey) {
				await manifestStore.update((currentManifest) =>
					currentManifest.map((entry) =>
						entry.entityType === prepared.entityType &&
						entry.entityKey === prepared.entityKey &&
						entry.path === prepared.path
							? { ...entry, storageKey: prepared.storageKey }
							: entry,
					),
				);
			}
		} catch (error) {
			const cleanupError = await storage.delete(uploadedKey).then(
				() => null,
				(cleanupFailure) => cleanupFailure,
			);
			if (cleanupError) {
				throw new AggregateError(
					[error, cleanupError],
					`Canonical media migration failed for ${prepared.label}, and cleanup failed.`,
				);
			}
			throw error;
		}
	}

	return { total: preparedEntries.length, uploaded, reused };
}

/**
 * Verify all local inputs before the first remote mutation. This makes missing or inconsistent
 * repository assets fail as a preflight error rather than leaving a partially imported set.
 *
 * @param {ReadonlyArray<import("../media.types.js").CanonicalMediaManifestEntry>} manifest
 * @param {string} publicDirectory
 */
async function preflightManifest(manifest, publicDirectory) {
	if (!Array.isArray(manifest) || manifest.length === 0) {
		throw new Error("Canonical media migration requires a non-empty manifest.");
	}

	const preparedEntries = [];
	for (const entry of manifest) {
		const label = `${entry.entityType} "${entry.entityKey}"`;
		if (typeof entry.path !== "string") {
			throw new Error(`Canonical media migration missing local path for ${label}.`);
		}
		const legacyKey = legacyMediaPathToObjectKey(entry.path);
		const absolutePath = path.resolve(publicDirectory, legacyKey);
		if (!absolutePath.startsWith(`${path.resolve(publicDirectory)}${path.sep}`)) {
			throw new Error(
				`Canonical media migration path escapes public media for ${label}.`,
			);
		}
		let bytes;
		try {
			bytes = await readFile(absolutePath);
		} catch (error) {
			throw new Error(
				`Canonical media migration source is missing for ${label}: ${entry.path}.`,
				{ cause: error },
			);
		}

		const extension = MIME_EXTENSIONS[entry.mimeType];
		if (!extension) {
			throw new Error(
				`Canonical media migration does not support MIME type ${entry.mimeType} for ${label}.`,
			);
		}
		const hasStorageKey = entry.storageKey !== undefined;
		const storageKey = hasStorageKey
			? validateMappedStorageKey(entry.storageKey, extension, label)
			: createPublicMediaObjectKey({ extension });
		preparedEntries.push({
			...entry,
			label,
			bytes,
			legacyKey,
			extension,
			storageKey,
			hasStorageKey,
			mimeType: entry.mimeType,
		});
	}
	return preparedEntries;
}

/** @param {MediaMigrationStorage} storage @param {any} prepared */
async function assertMatchingRemoteBytes(storage, prepared) {
	if (!(await storage.exists(prepared.storageKey))) {
		throw new Error(
			`Canonical media migration upload did not create ${prepared.storageKey} for ${prepared.label}.`,
		);
	}
	const remoteBytes = await storage.read(prepared.storageKey);
	if (!remoteBytes.equals(prepared.bytes)) {
		throw new Error(
			`Canonical media migration found different bytes at ${prepared.storageKey} for ${prepared.label}; refusing to overwrite it.`,
		);
	}
}

/** @param {unknown} value @param {string} extension @param {string} label @returns {string} */
function validateMappedStorageKey(value, extension, label) {
	let normalized;
	try {
		normalized = normalizeMediaObjectKey(value);
	} catch (error) {
		throw new Error(
			`Canonical media migration has an invalid storage key for ${label}.`,
			{ cause: error },
		);
	}
	if (
		!normalized.startsWith("assets/") ||
		!normalized.endsWith(`.${extension}`) ||
		!/^assets\/[a-z0-9][a-z0-9-]*\.[a-z0-9]+$/iu.test(normalized)
	) {
		throw new Error(
			`Canonical media migration requires an opaque assets key with the ${extension} extension for ${label}.`,
		);
	}
	return normalized;
}

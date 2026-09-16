import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalMediaManifest } from "./mediaManifest.js";
import { validateCanonicalMediaManifest } from "../../../db/mediaSeedSql.js";

/** @typedef {import("./media.types.js").CanonicalMediaManifestEntry} CanonicalMediaManifestEntry */

export const CANONICAL_MEDIA_PROVISION_MODES = Object.freeze([
	"verify",
	"dry-run",
	"apply",
]);

export class CanonicalMediaBaselineProvisioningError extends Error {
	/** @param {Array<{entityType?: string, entityKey?: string, objectKey?: string, reason: string, cause?: unknown, details?: Record<string, string | number>}>} issues */
	constructor(issues) {
		super(
			`Canonical media baseline provisioning failed with ${issues.length} issue(s).`,
		);
		this.name = "CanonicalMediaBaselineProvisioningError";
		this.issues = issues;
	}
}

/**
 * Compare repository source bytes with their exact manifest object keys, optionally creating only
 * missing objects. The injected object store must make `putIfAbsent` conditional; this function
 * never deletes or overwrites an existing object. Existing bytes are adopted and reported as
 * drift when they differ from the repository source.
 *
 * @param {{manifest?: ReadonlyArray<CanonicalMediaManifestEntry>, objectStore: {read: (storageKey: string) => Promise<Buffer | null>, inspect?: (storageKey: string) => Promise<{bytes: Buffer, contentType?: string, contentLength?: number, etag?: string, lastModified?: Date} | null>, putIfAbsent: (storageKey: string, bytes: Buffer, metadata: {contentType: string}) => Promise<void>}, mode?: "verify" | "dry-run" | "apply", publicDirectory?: string}} input
 * @returns {Promise<{mode: "verify" | "dry-run" | "apply", total: number, adopted: number, identical: number, byteDriftWarnings: number, missing: number, created: number, failures: number, warnings: Array<{entityType?: string, entityKey?: string, objectKey?: string, reason: string, details?: Record<string, string | number>}>}>}
 */
export async function provisionCanonicalMediaBaseline({
	manifest = canonicalMediaManifest,
	objectStore,
	mode = "verify",
	publicDirectory = path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		"../../../public",
	),
}) {
	if (!CANONICAL_MEDIA_PROVISION_MODES.includes(mode))
		throw new Error(
			`Canonical media provisioning mode must be one of: ${CANONICAL_MEDIA_PROVISION_MODES.join(", ")}.`,
		);
	const entries = validateCanonicalMediaManifest(manifest);
	const issues = [];
	const warnings = [];
	let adopted = 0;
	let identical = 0;
	let byteDriftWarnings = 0;
	let missing = 0;
	let created = 0;
	let failures = 0;

	for (const entry of entries) {
		let sourceBytes;
		try {
			sourceBytes = await readFile(path.resolve(publicDirectory, entry.path.slice(1)));
		} catch (error) {
			failures += 1;
			issues.push({
				entityType: entry.entityType,
				entityKey: entry.entityKey,
				objectKey: entry.storageKey,
				reason: "repository source file could not be read",
				cause: error,
			});
			continue;
		}

		let existingObject;
		try {
			existingObject = await readStoredObject(objectStore, entry.storageKey);
		} catch (error) {
			failures += 1;
			issues.push({
				entityType: entry.entityType,
				entityKey: entry.entityKey,
				objectKey: entry.storageKey,
				reason: "existing R2 object could not be read",
				cause: error,
			});
			continue;
		}

		const existingBytes = existingObject?.bytes;
		if (existingBytes) {
			adopted += 1;
			if (existingBytes.equals(sourceBytes)) {
				identical += 1;
				continue;
			}
			byteDriftWarnings += 1;
			driftDetails(warnings, entry, sourceBytes, existingBytes, existingObject);
			continue;
		}

		missing += 1;
		if (mode === "verify") {
			issues.push({
				entityType: entry.entityType,
				entityKey: entry.entityKey,
				objectKey: entry.storageKey,
				reason: "canonical R2 object is missing",
			});
			continue;
		}
		if (mode !== "apply") continue;

		try {
			await objectStore.putIfAbsent(entry.storageKey, sourceBytes, {
				contentType: entry.mimeType,
			});
		} catch (error) {
			// A conditional write can lose a race to an identical object. Re-read before
			// reporting failure so a successful concurrent provisioning is idempotent.
			try {
				const racedObject = await readStoredObject(objectStore, entry.storageKey);
				if (racedObject) {
					missing -= 1;
					adopted += 1;
					if (racedObject.bytes.equals(sourceBytes)) identical += 1;
					else {
						byteDriftWarnings += 1;
						driftDetails(warnings, entry, sourceBytes, racedObject.bytes, racedObject);
					}
					continue;
				}
			} catch {
				// Report the original provisioning failure below.
			}
			issues.push({
				entityType: entry.entityType,
				entityKey: entry.entityKey,
				objectKey: entry.storageKey,
				reason: "missing R2 object could not be provisioned",
				cause: error,
			});
			failures += 1;
			continue;
		}

		try {
			const provisionedObject = await readStoredObject(objectStore, entry.storageKey);
			if (!provisionedObject) {
				issues.push({
					entityType: entry.entityType,
					entityKey: entry.entityKey,
					objectKey: entry.storageKey,
					reason: "provisioned R2 object disappeared before verification",
				});
				failures += 1;
				continue;
			}
			missing -= 1;
			adopted += 1;
			if (!provisionedObject.bytes.equals(sourceBytes)) {
				byteDriftWarnings += 1;
				driftDetails(
					warnings,
					entry,
					sourceBytes,
					provisionedObject.bytes,
					provisionedObject,
				);
			}
			created += 1;
		} catch (error) {
			failures += 1;
			issues.push({
				entityType: entry.entityType,
				entityKey: entry.entityKey,
				objectKey: entry.storageKey,
				reason: "provisioned R2 object could not be verified",
				cause: error,
			});
		}
	}

	if (issues.length > 0) throw new CanonicalMediaBaselineProvisioningError(issues);
	return {
		mode,
		total: entries.length,
		adopted,
		identical,
		byteDriftWarnings,
		missing,
		created,
		failures,
		warnings,
	};
}

/** @param {Array<{entityType?: string, entityKey?: string, objectKey?: string, reason: string, cause?: unknown, details?: Record<string, string | number>}>} warnings @param {CanonicalMediaManifestEntry} entry @param {Buffer} expectedBytes @param {Buffer} actualBytes @param {{contentType?: string, contentLength?: number, etag?: string, lastModified?: Date}} actualObject */
function driftDetails(warnings, entry, expectedBytes, actualBytes, actualObject) {
	warnings.push({
		entityType: entry.entityType,
		entityKey: entry.entityKey,
		objectKey: entry.storageKey,
		reason: "existing R2 object adopted with different bytes",
		details: {
			sourcePath: entry.path,
			expectedSha256: sha256(expectedBytes),
			actualSha256: sha256(actualBytes),
			expectedBytes: expectedBytes.length,
			actualBytes: actualBytes.length,
			expectedMimeType: entry.mimeType,
			expectedWidth: entry.width,
			expectedHeight: entry.height,
			...(actualObject.contentType
				? { actualContentType: actualObject.contentType }
				: {}),
			...(typeof actualObject.contentLength === "number"
				? { actualContentLength: actualObject.contentLength }
				: {}),
			...(actualObject.etag ? { actualEtag: actualObject.etag } : {}),
			...(actualObject.lastModified
				? { actualLastModified: actualObject.lastModified.toISOString() }
				: {}),
		},
	});
}

/** @param {{read: (storageKey: string) => Promise<Buffer | null>, inspect?: (storageKey: string) => Promise<{bytes: Buffer, contentType?: string, contentLength?: number, etag?: string, lastModified?: Date} | null>}} objectStore @param {string} storageKey */
async function readStoredObject(objectStore, storageKey) {
	if (typeof objectStore.inspect === "function") return objectStore.inspect(storageKey);
	const bytes = await objectStore.read(storageKey);
	return bytes ? { bytes } : null;
}

/** @param {Buffer} value @returns {string} */
function sha256(value) {
	return createHash("sha256").update(value).digest("hex");
}

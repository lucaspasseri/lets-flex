/**
 * Provider-independent contract for public media bytes.
 *
 * Storage keys are opaque application values. Adapters may use any provider-specific representation
 * internally, but callers must use `getPublicUrl` when producing a browser-facing URL.
 *
 * @typedef {object} MediaStorage
 * @property {(buffer: Buffer, options: {extension: string, filename?: string, contentType?: string}) => Promise<{storageKey: string}>} put
 * @property {(storageKey: string) => Promise<void>} delete
 * @property {(storageKey: string) => Promise<boolean>} exists
 * @property {(storageKey: string) => Promise<Buffer>} read
 * @property {(storageKey: string) => string} getPublicUrl
 */

const REQUIRED_OPERATIONS = Object.freeze([
	"put",
	"delete",
	"exists",
	"read",
	"getPublicUrl",
]);

export class MediaStorageCleanupError extends Error {
	constructor() {
		super("Media write failed and cleanup could not be confirmed.");
		this.name = "MediaStorageCleanupError";
	}
}

/**
 * Compensate a public object created before a database transaction failed. The original error is
 * preserved when cleanup succeeds; cleanup failure becomes a safe operational error without
 * embedding provider details or credentials.
 *
 * @param {import("./storage.js").MediaStorage} storage
 * @param {string} storageKey
 * @param {unknown} operationError
 * @returns {Promise<never>}
 */
export async function compensateMediaStorageWrite(storage, storageKey, operationError) {
	try {
		await storage.delete(storageKey);
	} catch {
		throw new MediaStorageCleanupError();
	}
	throw operationError;
}

/**
 * Validate an injected public-media adapter at the application boundary.
 *
 * @param {unknown} storage
 * @returns {import("./storage.js").MediaStorage}
 */
export function assertMediaStorage(storage) {
	if (
		!storage ||
		typeof storage !== "object" ||
		REQUIRED_OPERATIONS.some(
			(operation) => typeof (/** @type {any} */ (storage)[operation]) !== "function",
		)
	) {
		throw new TypeError("A complete public media storage adapter is required.");
	}
	return /** @type {import("./storage.js").MediaStorage} */ (storage);
}

export {};

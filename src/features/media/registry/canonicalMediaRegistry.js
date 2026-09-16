import { validateCanonicalRegistryEntry } from "./canonicalMediaRegistrySchema.js";
import { createR2CanonicalMediaRegistryFromEnvironment } from "./r2CanonicalMediaRegistry.js";

/**
 * @typedef {object} CanonicalMediaRegistryStore
 * @property {(entityType: string, entityKey: string) => Promise<{entry: import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry, etag?: string} | null>} getCanonicalOverride
 * @property {(entry: import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry, options?: {expectedEtag?: string | null}) => Promise<{entry: import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry, etag?: string}>} putCanonicalOverride
 * @property {(entityType: string, entityKey: string, options?: {expectedEtag?: string}) => Promise<void>} deleteCanonicalOverride
 * @property {() => Promise<Array<{entry: import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry, etag?: string}>>} listCanonicalOverrides
 */

export class CanonicalMediaRegistryError extends Error {
	/** @param {string} code @param {string} message @param {unknown} [cause] */
	constructor(code, message, cause) {
		super(message, cause === undefined ? undefined : { cause });
		this.name = "CanonicalMediaRegistryError";
		this.code = code;
	}
}

/**
 * Keep validation and identity handling in the application-owned domain boundary. The injected
 * store may be backed by R2, a test fake, or a future private provider without changing callers.
 *
 * @param {CanonicalMediaRegistryStore} store
 */
export function createCanonicalMediaRegistry(store) {
	if (!store || typeof store !== "object")
		throw new TypeError("A canonical media registry store is required.");
	for (const operation of [
		"getCanonicalOverride",
		"putCanonicalOverride",
		"deleteCanonicalOverride",
		"listCanonicalOverrides",
	]) {
		if (typeof store[operation] !== "function")
			throw new TypeError(
				`Canonical media registry operation is missing: ${operation}.`,
			);
	}

	return {
		/** @param {string} entityType @param {string} entityKey */
		async getCanonicalOverride(entityType, entityKey) {
			const identity = validateIdentity(entityType, entityKey);
			try {
				const result = await store.getCanonicalOverride(
					identity.entityType,
					identity.entityKey,
				);
				if (!result) return null;
				const entry = validateCanonicalRegistryEntry(result.entry);
				assertSameIdentity(entry, identity);
				return { ...result, entry };
			} catch (error) {
				throw asRegistryError(
					"read_failed",
					"Canonical registry could not be read.",
					error,
				);
			}
		},
		/** @param {import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry} entry @param {{expectedEtag?: string | null}} [options] */
		async putCanonicalOverride(entry, options = {}) {
			let validated;
			try {
				validated = validateCanonicalRegistryEntry(entry);
			} catch (error) {
				throw asRegistryError(
					"invalid_entry",
					"Canonical registry entry is invalid.",
					error,
				);
			}
			try {
				const result = await store.putCanonicalOverride(validated, options);
				return { ...result, entry: validateCanonicalRegistryEntry(result.entry) };
			} catch (error) {
				throw asRegistryError(
					isConflictError(error) ? "write_conflict" : "write_failed",
					isConflictError(error)
						? "Canonical registry changed before this write completed."
						: "Canonical registry could not be written.",
					error,
				);
			}
		},
		/** @param {string} entityType @param {string} entityKey @param {{expectedEtag?: string}} [options] */
		async deleteCanonicalOverride(entityType, entityKey, options) {
			const identity = validateIdentity(entityType, entityKey);
			try {
				return await store.deleteCanonicalOverride(
					identity.entityType,
					identity.entityKey,
					options,
				);
			} catch (error) {
				throw asRegistryError(
					"delete_failed",
					"Canonical registry could not be deleted.",
					error,
				);
			}
		},
		async listCanonicalOverrides() {
			try {
				const results = await store.listCanonicalOverrides();
				return results.map((result) => {
					const entry = validateCanonicalRegistryEntry(result.entry);
					assertSameIdentity(entry, {
						entityType: entry.entityType,
						entityKey: entry.entityKey,
					});
					return { ...result, entry };
				});
			} catch (error) {
				throw asRegistryError(
					"list_failed",
					"Canonical registry could not be listed.",
					error,
				);
			}
		},
	};
}

/** @param {NodeJS.ProcessEnv} [environment] @param {{client?: {send: (command: object) => Promise<unknown>}}} [options] */
export function createCanonicalMediaRegistryFromEnvironment(
	environment = process.env,
	options = {},
) {
	return createCanonicalMediaRegistry(
		createR2CanonicalMediaRegistryFromEnvironment(environment, options),
	);
}

/**
 * Defer registry configuration until a durability operation is requested. This preserves the
 * existing development/test startup behavior when registry-backed actions are not exercised while
 * still making a configured Admin promotion fail predictably at its trust boundary.
 *
 * @param {NodeJS.ProcessEnv} [environment]
 */
export function createLazyCanonicalMediaRegistry(environment = process.env) {
	/** @type {ReturnType<typeof createCanonicalMediaRegistry> | undefined} */
	let registry;
	const getRegistry = () =>
		(registry ??= createCanonicalMediaRegistryFromEnvironment(environment));
	return {
		async getCanonicalOverride(entityType, entityKey) {
			return getRegistry().getCanonicalOverride(entityType, entityKey);
		},
		async putCanonicalOverride(entry, options) {
			return getRegistry().putCanonicalOverride(entry, options);
		},
		async deleteCanonicalOverride(entityType, entityKey, options) {
			return getRegistry().deleteCanonicalOverride(entityType, entityKey, options);
		},
		async listCanonicalOverrides() {
			return getRegistry().listCanonicalOverrides();
		},
	};
}

/** @param {string} entityType @param {string} entityKey */
function validateIdentity(entityType, entityKey) {
	try {
		const entry = validateCanonicalRegistryEntry({
			schemaVersion: 1,
			entityType,
			entityKey,
			role: "canonical",
			asset: {
				objectKey: "assets/placeholder",
				mimeType: "image/png",
				width: 1,
				height: 1,
			},
			canonicalPath: "/media/placeholder.png",
			alt: { en: "placeholder", "pt-BR": "placeholder" },
			updatedAt: new Date(0).toISOString(),
		});
		return { entityType: entry.entityType, entityKey: entry.entityKey };
	} catch (error) {
		throw asRegistryError(
			"invalid_identity",
			"Canonical registry identity is invalid.",
			error,
		);
	}
}

/** @param {import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry} entry @param {{entityType: string, entityKey: string}} identity */
function assertSameIdentity(entry, identity) {
	if (
		entry.entityType !== identity.entityType ||
		entry.entityKey !== identity.entityKey
	)
		throw new Error(
			"Canonical registry object identity does not match its requested entity.",
		);
}

/** @param {string} code @param {string} message @param {unknown} cause */
function asRegistryError(code, message, cause) {
	if (cause instanceof CanonicalMediaRegistryError && cause.code === code) return cause;
	return new CanonicalMediaRegistryError(code, message, cause);
}

/** @param {unknown} error @returns {boolean} */
function isConflictError(error) {
	const candidate =
		/** @type {{code?: string, name?: string, $metadata?: {httpStatusCode?: number}}} */ (
			error
		);
	return (
		candidate?.code === "write_conflict" ||
		candidate?.name === "PreconditionFailed" ||
		candidate?.$metadata?.httpStatusCode === 412
	);
}

import { randomUUID } from "node:crypto";

export const PUBLIC_MEDIA_OBJECT_KEY_PREFIX = "assets";

const OBJECT_KEY_PATTERN = /^[a-z0-9][a-z0-9._/-]*$/iu;
const GENERATED_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/iu;

/**
 * Create the key for a new public media object. The generated identifier is the only identity
 * encoded in the key; filenames and mutable entity names are deliberately ignored.
 *
 * @param {{extension: string, generatedId?: string}} input
 * @returns {string}
 */
export function createPublicMediaObjectKey({ extension, generatedId = randomUUID() }) {
	if (typeof generatedId !== "string" || !GENERATED_ID_PATTERN.test(generatedId)) {
		throw new Error("Media object identifier is invalid.");
	}
	const normalizedExtension = normalizeExtension(extension);
	return `${PUBLIC_MEDIA_OBJECT_KEY_PREFIX}/${generatedId}.${normalizedExtension}`;
}

/**
 * Validate a provider-neutral object key. Keys are relative object-store values, never URLs or
 * slash-prefixed browser paths.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeMediaObjectKey(value) {
	if (
		typeof value !== "string" ||
		value === "" ||
		value.startsWith("/") ||
		value.includes("\\") ||
		value.includes("?") ||
		value.includes("#") ||
		value
			.split("/")
			.some((segment) => segment === "" || segment === "." || segment === "..") ||
		!OBJECT_KEY_PATTERN.test(value)
	) {
		throw new Error("Media object key is invalid.");
	}
	return value;
}

/**
 * Convert an existing local public media path to its object-key representation without changing
 * the relative path. This is a migration-boundary helper, not a rename operation.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function legacyMediaPathToObjectKey(value) {
	if (typeof value !== "string" || !value.startsWith("/media/")) {
		throw new Error("Legacy media path must be under /media/.");
	}
	return normalizeMediaObjectKey(value.slice(1));
}

/** @param {string} value @returns {string} */
function normalizeExtension(value) {
	if (typeof value !== "string" || !/^[a-z0-9]+$/iu.test(value)) {
		throw new Error("Media object extension is invalid.");
	}
	return value.toLowerCase();
}

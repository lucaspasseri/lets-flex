import { normalizeMediaObjectKey } from "../storage/mediaObjectKey.js";

/** @typedef {"exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern"} CanonicalRegistryEntityType */

export const CANONICAL_REGISTRY_SCHEMA_VERSION = 1;
export const CANONICAL_REGISTRY_ROLE = "canonical";
export const CANONICAL_REGISTRY_ENTITY_TYPES = Object.freeze([
	"exercise",
	"exercise_variant",
	"muscle",
	"equipment",
	"movement_pattern",
]);

const entityTypeSet = new Set(CANONICAL_REGISTRY_ENTITY_TYPES);
const catalogKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const mimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

/**
 * Validate and normalize persistent registry input. Registry files are infrastructure input, so
 * validation is deliberately stricter than the database's generic media columns.
 *
 * @param {unknown} value
 * @returns {CanonicalRegistryEntry}
 */
export function validateCanonicalRegistryEntry(value) {
	if (!isRecord(value)) throw invalidEntry("entry must be an object");
	if (value.schemaVersion !== CANONICAL_REGISTRY_SCHEMA_VERSION)
		throw invalidEntry("unsupported schema version");
	if (!entityTypeSet.has(value.entityType))
		throw invalidEntry("unsupported entity type");
	const entityKey = requiredCatalogKey(value.entityKey);
	if (value.role !== CANONICAL_REGISTRY_ROLE)
		throw invalidEntry("role must be canonical");
	if (!isRecord(value.asset)) throw invalidEntry("asset metadata is required");
	const objectKey = safeObjectKey(value.asset.objectKey);
	const mimeType = requiredMimeType(value.asset.mimeType);
	const width = positiveInteger(value.asset.width, "asset width");
	const height = positiveInteger(value.asset.height, "asset height");
	if (!isRecord(value.alt)) throw invalidEntry("localized alt text is required");
	const alt = {
		en: requiredText(value.alt.en, "English alt text"),
		"pt-BR": requiredText(value.alt["pt-BR"], "Brazilian Portuguese alt text"),
	};
	const canonicalPath = safeCanonicalPath(value.canonicalPath);
	const updatedAt = requiredDate(value.updatedAt);
	const checksum = value.asset.checksum;
	if (
		checksum !== undefined &&
		(typeof checksum !== "string" || !/^[a-f0-9]{64}$/u.test(checksum))
	)
		throw invalidEntry("asset checksum must be a SHA-256 hex digest");

	return {
		schemaVersion: CANONICAL_REGISTRY_SCHEMA_VERSION,
		entityType: /** @type {CanonicalRegistryEntityType} */ (value.entityType),
		entityKey,
		role: CANONICAL_REGISTRY_ROLE,
		asset: {
			objectKey,
			mimeType,
			width,
			height,
			...(checksum ? { checksum } : {}),
		},
		canonicalPath,
		alt,
		updatedAt,
	};
}

/** @param {CanonicalRegistryEntityType} entityType @param {string} entityKey @param {string} prefix */
export function canonicalRegistryObjectKey(entityType, entityKey, prefix = "v1") {
	const entry = validateCanonicalRegistryEntry({
		schemaVersion: CANONICAL_REGISTRY_SCHEMA_VERSION,
		entityType,
		entityKey,
		role: CANONICAL_REGISTRY_ROLE,
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
	const safePrefix = normalizePrefix(prefix);
	return `${safePrefix}/${entry.entityType}/${entry.entityKey}.json`;
}

/** @param {unknown} value @returns {value is Record<string, any>} */
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @param {unknown} value @returns {string} */
function requiredCatalogKey(value) {
	if (typeof value !== "string" || !catalogKeyPattern.test(value))
		throw invalidEntry("entity key must be a stable catalog key");
	return value;
}

/** @param {unknown} value @returns {string} */
function safeObjectKey(value) {
	if (
		typeof value !== "string" ||
		!value.startsWith("assets/") ||
		value.includes("\\") ||
		value.includes("..") ||
		value.includes("//") ||
		hasUnsafeControlCharacters(value)
	)
		throw invalidEntry("asset object key is unsafe");
	const normalized = normalizeMediaObjectKey(value);
	if (normalized !== value || normalized.split("/").some((part) => part === ""))
		throw invalidEntry("asset object key is unsafe");
	return normalized;
}

/** @param {unknown} value @returns {string} */
function requiredMimeType(value) {
	if (typeof value !== "string" || !mimeTypes.has(value))
		throw invalidEntry("asset MIME type is unsupported");
	return value;
}

/** @param {unknown} value @param {string} label @returns {number} */
function positiveInteger(value, label) {
	if (typeof value !== "number" || !Number.isInteger(value) || value <= 0)
		throw invalidEntry(`${label} must be a positive integer`);
	return value;
}

/** @param {unknown} value @param {string} label @returns {string} */
function requiredText(value, label) {
	if (typeof value !== "string" || value.trim() === "")
		throw invalidEntry(`${label} is required`);
	return value.trim();
}

/** @param {unknown} value @returns {string} */
function safeCanonicalPath(value) {
	if (
		typeof value !== "string" ||
		!value.startsWith("/media/") ||
		value.includes("..") ||
		value.includes("\\") ||
		hasUnsafeControlCharacters(value)
	)
		throw invalidEntry("canonical media path is unsafe");
	return value;
}

/** @param {unknown} value @returns {string} */
function requiredDate(value) {
	if (typeof value !== "string" || Number.isNaN(Date.parse(value)))
		throw invalidEntry("updatedAt must be an ISO date");
	return value;
}

/** @param {string} value @returns {string} */
function normalizePrefix(value) {
	if (
		typeof value !== "string" ||
		value.trim() === "" ||
		value.includes("..") ||
		value.includes("\\") ||
		value.split("/").some((part) => part === "")
	)
		throw new Error("Canonical registry prefix is unsafe.");
	return value.replace(/^\/|\/$/gu, "");
}

/** @param {string} value @returns {boolean} */
function hasUnsafeControlCharacters(value) {
	return [...value].some((character) => {
		const code = character.charCodeAt(0);
		return code < 32 || code === 127;
	});
}

/** @param {string} reason @returns {Error} */
function invalidEntry(reason) {
	return new Error(`Invalid canonical registry entry: ${reason}.`);
}

/** @typedef {object} CanonicalRegistryEntry
 * @property {1} schemaVersion
 * @property {CanonicalRegistryEntityType} entityType
 * @property {string} entityKey
 * @property {"canonical"} role
 * @property {{objectKey: string, mimeType: string, width: number, height: number, checksum?: string}} asset
 * @property {string} canonicalPath
 * @property {{en: string, "pt-BR": string}} alt
 * @property {string} updatedAt
 */

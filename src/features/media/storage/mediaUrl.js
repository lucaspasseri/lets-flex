import { canonicalMediaManifest } from "../mediaManifest.js";
import { normalizeMediaObjectKey } from "./mediaObjectKey.js";

/** @typedef {import("../media.types.js").CanonicalMediaManifestEntry} CanonicalMediaManifestEntry */

/**
 * Provider-independent read-side URL boundary. The second argument is the local/fallback source
 * to preserve when remote public reads are disabled or when a non-migrated local object has no
 * remote mapping yet.
 *
 * @typedef {(storageKey: string, fallbackSource?: string | null) => string | null} MediaUrlResolver
 */

/**
 * Create a URL resolver for persisted media references. Canonical legacy paths are translated via
 * the durable manifest mapping; arbitrary local upload paths remain local until a later write
 * migration creates their remote object.
 *
 * @param {{publicUrlBase?: string, remoteReads?: boolean, canonicalManifest?: ReadonlyArray<CanonicalMediaManifestEntry>}} [options]
 * @returns {MediaUrlResolver}
 */
export function createMediaUrlResolver({
	publicUrlBase,
	remoteReads = false,
	canonicalManifest = canonicalMediaManifest,
} = {}) {
	const normalizedPublicUrlBase = remoteReads
		? assertPublicUrlBase(publicUrlBase)
		: null;
	const legacyPathToStorageKey = new Map(
		canonicalManifest
			.filter((entry) => typeof entry.storageKey === "string")
			.map((entry) => [entry.path, entry.storageKey]),
	);

	return (storageKey, fallbackSource = storageKey) => {
		if (!remoteReads || !normalizedPublicUrlBase) return fallbackSource;
		const mappedKey =
			legacyPathToStorageKey.get(storageKey) ??
			legacyPathToStorageKey.get(
				typeof storageKey === "string" && storageKey.startsWith("/")
					? storageKey
					: `/${storageKey}`,
			);
		const candidate = mappedKey ?? storageKey;
		if (typeof candidate !== "string" || !candidate.startsWith("assets/")) {
			return fallbackSource;
		}
		const encodedKey = normalizeMediaObjectKey(candidate)
			.split("/")
			.map((segment) => encodeURIComponent(segment))
			.join("/");
		return `${normalizedPublicUrlBase}/${encodedKey}`;
	};
}

/**
 * Build the read-side URL boundary from non-secret environment configuration. R2 credentials are
 * intentionally not needed to derive a public URL and are never read here.
 *
 * @param {NodeJS.ProcessEnv} [environment]
 * @returns {MediaUrlResolver}
 */
export function createMediaUrlResolverFromEnvironment(environment = process.env) {
	const provider = (
		environment.OBJECT_STORAGE_PROVIDER?.trim() ||
		environment.MEDIA_STORAGE_PROVIDER?.trim() ||
		"local"
	).toLowerCase();
	if (environment.NODE_ENV === "production" && provider === "local") {
		throw new Error("Production media URLs require OBJECT_STORAGE_PROVIDER=r2.");
	}
	if (provider === "local") return createMediaUrlResolver();
	if (provider !== "r2") {
		throw new Error(`Unsupported media storage provider: ${provider}.`);
	}
	return createMediaUrlResolver({
		remoteReads: true,
		publicUrlBase: environment.MEDIA_PUBLIC_URL,
	});
}

/** @param {unknown} value @returns {string} */
function assertPublicUrlBase(value) {
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error("MEDIA_PUBLIC_URL is required for remote media reads.");
	}
	const parsed = new URL(value.trim());
	if (
		!/^https?:$/u.test(parsed.protocol) ||
		parsed.username ||
		parsed.password ||
		parsed.search ||
		parsed.hash
	) {
		throw new Error(
			"MEDIA_PUBLIC_URL must be an HTTP(S) URL without credentials, query, or fragment.",
		);
	}
	return parsed.toString().replace(/\/$/u, "");
}

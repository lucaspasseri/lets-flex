import { createLocalMediaStorage } from "./localStorage.js";
import { createR2MediaStorageFromEnvironment } from "./r2Storage.js";

/** @typedef {import("./storage.js").MediaStorage} MediaStorage */
/** @typedef {{send: (command: object) => Promise<unknown>}} S3CommandClient */

/**
 * Select the public-media write/read adapter explicitly from environment configuration. Local is
 * the safe default; R2 is never selected implicitly.
 *
 * @param {NodeJS.ProcessEnv} [environment]
 * @param {{localOptions?: Parameters<typeof createLocalMediaStorage>[0], client?: S3CommandClient}} [options]
 * @returns {MediaStorage}
 */
export function createMediaStorageFromEnvironment(
	environment = process.env,
	options = {},
) {
	const provider = resolveStorageProvider(environment);
	if (environment.NODE_ENV === "production" && provider === "local") {
		throw new Error("Production media storage requires OBJECT_STORAGE_PROVIDER=r2.");
	}
	if (provider === "local") return createLocalMediaStorage(options.localOptions);
	if (provider === "r2") {
		return createR2MediaStorageFromEnvironment(environment, {
			...(options.client ? { client: options.client } : {}),
		});
	}
	throw new Error(`Unsupported media storage provider: ${provider}.`);
}

/** @param {NodeJS.ProcessEnv} environment @returns {string} */
function resolveStorageProvider(environment) {
	return (
		environment.OBJECT_STORAGE_PROVIDER?.trim() ||
		environment.MEDIA_STORAGE_PROVIDER?.trim() ||
		"local"
	).toLowerCase();
}

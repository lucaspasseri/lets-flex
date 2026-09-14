import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/** @typedef {import("./storage.js").MediaStorage} MediaStorage */

/**
 * Local implementation of the public-media storage contract. The local public prefix is retained
 * for compatibility with the current `/media/...` URLs until the object-key migration action.
 *
 * @param {{rootDirectory?: string, publicPrefix?: string, readRootDirectory?: string, readPublicPrefix?: string, publicUrlBase?: string | null}} [options]
 * @returns {MediaStorage}
 */
export function createLocalMediaStorage({
	rootDirectory = path.resolve(process.cwd(), "public/media/uploads"),
	publicPrefix = "/media/uploads",
	readRootDirectory = rootDirectory,
	readPublicPrefix = publicPrefix,
	publicUrlBase = null,
} = {}) {
	const normalizedPrefix = normalizePrefix(publicPrefix);
	const normalizedReadPrefix = normalizePrefix(readPublicPrefix);
	const resolvedReadRoot = path.resolve(readRootDirectory);
	const resolvedWriteRoot = path.resolve(rootDirectory);
	const normalizedPublicUrlBase = normalizePublicUrlBase(publicUrlBase);

	const resolveReadPath = (storageKey) => {
		const normalizedKey = normalizeStorageKey(storageKey, normalizedReadPrefix);
		const absolutePath = path.resolve(
			resolvedReadRoot,
			normalizedKey.slice(normalizedReadPrefix.length + 1),
		);
		assertWithinRoot(absolutePath, resolvedReadRoot);
		return { absolutePath, normalizedKey };
	};
	const resolveWritePath = (storageKey) => {
		const normalizedKey = normalizeStorageKey(storageKey, normalizedPrefix);
		const absolutePath = path.resolve(
			resolvedWriteRoot,
			normalizedKey.slice(normalizedPrefix.length + 1),
		);
		assertWithinRoot(absolutePath, resolvedWriteRoot);
		return absolutePath;
	};
	const normalizeFilename = (filename) => {
		if (filename === undefined) return randomUUID();
		if (typeof filename !== "string" || !/^[a-z0-9][a-z0-9._-]*$/iu.test(filename)) {
			throw new Error("Storage filename is invalid.");
		}
		return filename;
	};

	return /** @type {MediaStorage} */ ({
		/** @param {Buffer} buffer @param {{extension: string, filename?: string, contentType?: string}} metadata */
		async put(buffer, { extension, filename }) {
			await mkdir(resolvedWriteRoot, { recursive: true });
			const storedFilename = `${normalizeFilename(filename)}.${extension}`;
			const absolutePath = path.join(resolvedWriteRoot, storedFilename);
			await writeFile(absolutePath, buffer, { flag: "wx", mode: 0o644 });
			return { storageKey: `${normalizedPrefix}/${storedFilename}` };
		},
		/** @param {string} storageKey */
		async delete(storageKey) {
			await unlink(resolveWritePath(storageKey)).catch((error) => {
				if (error?.code !== "ENOENT") throw error;
			});
		},
		/** @param {string} storageKey */
		async exists(storageKey) {
			try {
				await access(resolveReadPath(storageKey).absolutePath);
				return true;
			} catch (error) {
				if (/** @type {any} */ (error)?.code === "ENOENT") return false;
				throw error;
			}
		},
		/** @param {string} storageKey */
		async read(storageKey) {
			return readFile(resolveReadPath(storageKey).absolutePath);
		},
		/** @param {string} storageKey */
		getPublicUrl(storageKey) {
			const normalizedKey = resolveReadPath(storageKey).normalizedKey;
			return normalizedPublicUrlBase
				? `${normalizedPublicUrlBase}${normalizedKey}`
				: normalizedKey;
		},
	});
}

/** @param {string} value @returns {string} */
function normalizePrefix(value) {
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error("Media storage prefix is required.");
	}
	return "/" + value.replace(/^\/+|\/+$/gu, "");
}

/** @param {unknown} value @param {string} prefix @returns {string} */
function normalizeStorageKey(value, prefix) {
	if (typeof value !== "string") throw new Error("Storage key must be a string.");
	const normalizedKey = value.startsWith("/") ? value : `/${value}`;
	if (!normalizedKey.startsWith(`${prefix}/`)) {
		throw new Error("Storage key is outside the local media boundary.");
	}
	return normalizedKey;
}

/** @param {string} absolutePath @param {string} rootDirectory */
function assertWithinRoot(absolutePath, rootDirectory) {
	if (
		absolutePath !== rootDirectory &&
		!absolutePath.startsWith(`${rootDirectory}${path.sep}`)
	) {
		throw new Error("Storage key is outside the local media boundary.");
	}
}

/** @param {string | null | undefined} value @returns {string | null} */
function normalizePublicUrlBase(value) {
	if (value == null || value === "") return null;
	if (typeof value !== "string") throw new Error("Media public URL must be a string.");
	const parsed = new URL(value);
	if (
		!/^https?:$/u.test(parsed.protocol) ||
		parsed.username ||
		parsed.password ||
		parsed.search ||
		parsed.hash
	) {
		throw new Error(
			"Media public URL must be an HTTP(S) origin without a query or fragment.",
		);
	}
	return parsed.toString().replace(/\/$/u, "");
}

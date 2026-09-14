import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Keep uploaded media behind an application-owned boundary. Storage keys are generated here and
 * are the only paths exposed to the media repository/resolver.
 *
 * @param {{rootDirectory?: string, publicPrefix?: string, readRootDirectory?: string, readPublicPrefix?: string}} [options]
 */
export function createLocalMediaStorage({
	rootDirectory = path.resolve(process.cwd(), "public/media/uploads"),
	publicPrefix = "/media/uploads",
	readRootDirectory = rootDirectory,
	readPublicPrefix = publicPrefix,
} = {}) {
	const normalizedPrefix = "/" + publicPrefix.replace(/^\/+|\/+$/gu, "");
	const normalizedReadPrefix = "/" + readPublicPrefix.replace(/^\/+|\/+$/gu, "");
	const resolveReadPath = (storageKey) => {
		if (typeof storageKey !== "string")
			throw new Error("Storage key must be a string.");
		const normalizedKey = storageKey.startsWith("/") ? storageKey : `/${storageKey}`;
		if (!normalizedKey.startsWith(`${normalizedReadPrefix}/`)) {
			throw new Error("Storage key is outside the local media boundary.");
		}
		const relativeKey = normalizedKey.slice(normalizedReadPrefix.length + 1);
		const absolutePath = path.resolve(readRootDirectory, relativeKey);
		if (
			absolutePath !== path.resolve(readRootDirectory) &&
			!absolutePath.startsWith(`${path.resolve(readRootDirectory)}${path.sep}`)
		) {
			throw new Error("Storage key is outside the local media boundary.");
		}
		return absolutePath;
	};
	const normalizeFilename = (filename) => {
		if (filename === undefined) return `${randomUUID()}`;
		if (typeof filename !== "string" || !/^[a-z0-9][a-z0-9._-]*$/iu.test(filename)) {
			throw new Error("Storage filename is invalid.");
		}
		return filename;
	};
	return {
		/** @param {Buffer} buffer @param {{extension: string, filename?: string}} metadata */
		async save(buffer, { extension, filename }) {
			await mkdir(rootDirectory, { recursive: true });
			const storedFilename = `${normalizeFilename(filename)}.${extension}`;
			const absolutePath = path.join(rootDirectory, storedFilename);
			await writeFile(absolutePath, buffer, { flag: "wx", mode: 0o644 });
			return {
				storageKey: `${normalizedPrefix}/${storedFilename}`,
				async remove() {
					await unlink(absolutePath).catch((error) => {
						if (error?.code !== "ENOENT") throw error;
					});
				},
			};
		},
		/** @param {string} storageKey */
		async exists(storageKey) {
			try {
				await access(resolveReadPath(storageKey));
				return true;
			} catch (error) {
				if (/** @type {any} */ (error)?.code === "ENOENT") return false;
				throw error;
			}
		},
		/** @param {string} storageKey */
		async read(storageKey) {
			return readFile(resolveReadPath(storageKey));
		},
	};
}

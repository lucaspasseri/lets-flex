import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

/** @typedef {import("./media.types.js").CanonicalMediaManifestEntry} CanonicalMediaManifestEntry */
/**
 * @typedef {object} CanonicalMediaManifestStore
 * @property {string} filePath
 * @property {() => Promise<ReadonlyArray<CanonicalMediaManifestEntry>>} read
 * @property {(manifest: ReadonlyArray<CanonicalMediaManifestEntry>) => Promise<void>} write
 * @property {(update: (manifest: ReadonlyArray<CanonicalMediaManifestEntry>) => ReadonlyArray<CanonicalMediaManifestEntry> | Promise<ReadonlyArray<CanonicalMediaManifestEntry>>) => Promise<{previous: ReadonlyArray<CanonicalMediaManifestEntry>, manifest: ReadonlyArray<CanonicalMediaManifestEntry>}>} update
 */

export const defaultCanonicalMediaManifestPath = fileURLToPath(
	new URL("../../../data/canonical-media.json", import.meta.url),
);

/**
 * Read the source-controlled canonical bootstrap manifest without caching it. Runtime canonical
 * promotion does not use this file as mutable state.
 *
 * @param {string} [filePath]
 * @returns {Promise<ReadonlyArray<CanonicalMediaManifestEntry>>}
 */
export async function readCanonicalMediaManifest(
	filePath = defaultCanonicalMediaManifestPath,
) {
	const raw = await readFile(filePath, "utf8");
	const parsed = JSON.parse(raw);
	if (!Array.isArray(parsed)) {
		throw new Error("Canonical media manifest must be a JSON array.");
	}
	return /** @type {ReadonlyArray<CanonicalMediaManifestEntry>} */ (parsed);
}

/**
 * Create the small filesystem boundary used by seed/bootstrap tooling. Updates are serialized
 * within this process and written through a same-directory temporary file before replacement.
 *
 * @param {{filePath?: string}} [options]
 */
export function createCanonicalMediaManifestStore({
	filePath = defaultCanonicalMediaManifestPath,
} = {}) {
	/** @type {Promise<any>} */
	let pending = Promise.resolve();
	/** @param {() => Promise<any>} operation @returns {Promise<any>} */
	const enqueue = (operation) => {
		const result = pending.then(operation);
		pending = result.catch(() => {});
		return result;
	};

	return /** @type {CanonicalMediaManifestStore} */ ({
		filePath,
		read() {
			return enqueue(() => readCanonicalMediaManifest(filePath));
		},
		/** @param {ReadonlyArray<CanonicalMediaManifestEntry>} manifest */
		write(manifest) {
			return enqueue(() => writeCanonicalMediaManifest(manifest, filePath));
		},
		/**
		 * @param {(manifest: ReadonlyArray<CanonicalMediaManifestEntry>) => ReadonlyArray<CanonicalMediaManifestEntry> | Promise<ReadonlyArray<CanonicalMediaManifestEntry>>} update
		 */
		update(update) {
			return enqueue(async () => {
				const previous = await readCanonicalMediaManifest(filePath);
				const next = await update(previous);
				await writeCanonicalMediaManifest(next, filePath);
				return { previous, manifest: next };
			});
		},
	});
}

/**
 * @param {ReadonlyArray<CanonicalMediaManifestEntry>} manifest
 * @param {string} filePath
 */
async function writeCanonicalMediaManifest(manifest, filePath) {
	const directory = path.dirname(filePath);
	await mkdir(directory, { recursive: true });
	const temporaryPath = path.join(
		directory,
		`.${path.basename(filePath)}.${randomUUID()}.tmp`,
	);
	try {
		await writeFile(temporaryPath, `${JSON.stringify(manifest, null, "\t")}\n`, {
			flag: "wx",
			mode: 0o644,
		});
		await rename(temporaryPath, filePath);
	} catch (error) {
		await unlink(temporaryPath).catch(() => {});
		throw error;
	}
}

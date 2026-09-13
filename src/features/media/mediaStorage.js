import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Keep uploaded media behind an application-owned boundary. Storage keys are generated here and
 * are the only paths exposed to the media repository/resolver.
 *
 * @param {{rootDirectory?: string, publicPrefix?: string}} [options]
 */
export function createLocalMediaStorage({
	rootDirectory = path.resolve(process.cwd(), "public/media/uploads"),
	publicPrefix = "/media/uploads",
} = {}) {
	const normalizedPrefix = "/" + publicPrefix.replace(/^\/+|\/+$/gu, "");
	return {
		/** @param {Buffer} buffer @param {{extension: string}} metadata */
		async save(buffer, { extension }) {
			await mkdir(rootDirectory, { recursive: true });
			const filename = `${randomUUID()}.${extension}`;
			const absolutePath = path.join(rootDirectory, filename);
			await writeFile(absolutePath, buffer, { flag: "wx", mode: 0o644 });
			return {
				storageKey: `${normalizedPrefix}/${filename}`,
				async remove() {
					await unlink(absolutePath).catch((error) => {
						if (error?.code !== "ENOENT") throw error;
					});
				},
			};
		},
	};
}

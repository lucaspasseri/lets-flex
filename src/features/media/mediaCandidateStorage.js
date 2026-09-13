import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/** Private storage for unapproved candidates. Keys are opaque identifiers, never URL paths. */
export function createPrivateMediaCandidateStorage({
	rootDirectory = path.resolve(process.cwd(), "var/media/candidates"),
} = {}) {
	function absolutePath(storageKey) {
		if (
			typeof storageKey !== "string" ||
			!/^[0-9a-f-]+\.(png|jpg|webp)$/u.test(storageKey)
		) {
			throw new Error("Invalid private media candidate key.");
		}
		return path.join(rootDirectory, storageKey);
	}
	return {
		async save(buffer, { extension }) {
			const storageKey = `${randomUUID()}.${extension}`;
			const filePath = absolutePath(storageKey);
			await mkdir(rootDirectory, { recursive: true });
			await writeFile(filePath, buffer, { flag: "wx", mode: 0o600 });
			return {
				storageKey,
				async remove() {
					await unlink(filePath).catch((error) => {
						if (error?.code !== "ENOENT") throw error;
					});
				},
			};
		},
		read(storageKey) {
			return readFile(absolutePath(storageKey));
		},
		async remove(storageKey) {
			await unlink(absolutePath(storageKey)).catch((error) => {
				if (error?.code !== "ENOENT") throw error;
			});
		},
	};
}

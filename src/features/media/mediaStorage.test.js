import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createLocalMediaStorage } from "./mediaStorage.js";

test("local media storage generates a safe public key and removes only its stored object", async () => {
	const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "lets-flex-media-"));
	try {
		const storage = createLocalMediaStorage({
			rootDirectory,
			publicPrefix: "/media/uploads",
		});
		const stored = await storage.save(Buffer.from("image bytes"), { extension: "png" });
		const filename = path.basename(stored.storageKey);

		assert.match(stored.storageKey, /^\/media\/uploads\/[0-9a-f-]+\.png$/);
		assert.equal(
			await readFile(path.join(rootDirectory, filename), "utf8"),
			"image bytes",
		);

		await stored.remove();
		await assert.rejects(() => readFile(path.join(rootDirectory, filename)));
	} finally {
		await rm(rootDirectory, { recursive: true, force: true });
	}
});

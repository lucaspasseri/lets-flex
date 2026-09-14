import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

test("local media storage reads only keys inside its configured public boundary", async () => {
	const mediaRoot = await mkdtemp(path.join(os.tmpdir(), "lets-flex-media-read-"));
	try {
		const uploadRoot = path.join(mediaRoot, "uploads");
		await mkdir(uploadRoot, { recursive: true });
		await writeFile(path.join(uploadRoot, "existing.png"), "image bytes");
		const storage = createLocalMediaStorage({
			rootDirectory: uploadRoot,
			publicPrefix: "/media/uploads",
			readRootDirectory: mediaRoot,
			readPublicPrefix: "/media",
		});

		assert.equal(await storage.exists("/media/uploads/existing.png"), true);
		assert.equal(
			await storage
				.read("/media/uploads/existing.png")
				.then((buffer) => buffer.toString()),
			"image bytes",
		);
		await assert.rejects(
			() => storage.read("/media/../../outside.png"),
			/Storage key is outside the local media boundary/,
		);
	} finally {
		await rm(mediaRoot, { recursive: true, force: true });
	}
});

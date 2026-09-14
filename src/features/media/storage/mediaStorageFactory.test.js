import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createMediaStorageFromEnvironment } from "./mediaStorageFactory.js";

function fakeClient() {
	const commands = [];
	return {
		commands,
		async send(command) {
			commands.push(command);
			return {};
		},
	};
}

test("media storage selection defaults to local and preserves local adapter behavior", async () => {
	const rootDirectory = await mkdtemp(
		path.join(os.tmpdir(), "lets-flex-provider-local-"),
	);
	try {
		const storage = createMediaStorageFromEnvironment(
			{},
			{
				localOptions: { rootDirectory, publicPrefix: "/media/uploads" },
			},
		);
		const stored = await storage.put(Buffer.from("local bytes"), { extension: "png" });

		assert.match(stored.storageKey, /^\/media\/uploads\/[0-9a-f-]+\.png$/iu);
	} finally {
		await rm(rootDirectory, { recursive: true, force: true });
	}
});

test("media storage selection uses R2 only when explicitly configured", async () => {
	const client = fakeClient();
	const storage = createMediaStorageFromEnvironment(
		{
			OBJECT_STORAGE_PROVIDER: "r2",
			R2_BUCKET_NAME: "media-development",
			R2_ENDPOINT: "https://account.r2.cloudflarestorage.com",
			R2_ACCESS_KEY_ID: "access-key",
			R2_SECRET_ACCESS_KEY: "secret-key",
			MEDIA_PUBLIC_URL: "https://cdn.example.test",
		},
		{ client },
	);
	const stored = await storage.put(Buffer.from("remote bytes"), {
		extension: "png",
		contentType: "image/png",
	});

	assert.match(stored.storageKey, /^assets\/[0-9a-f-]{36}\.png$/iu);
	assert.equal(client.commands[0].input.Bucket, "media-development");
});

test("object storage provider selection takes precedence without changing public URL inputs", () => {
	const client = fakeClient();
	const storage = createMediaStorageFromEnvironment(
		{
			OBJECT_STORAGE_PROVIDER: "r2",
			MEDIA_STORAGE_PROVIDER: "local",
			R2_BUCKET_NAME: "media-development",
			R2_ENDPOINT: "https://account.r2.cloudflarestorage.com",
			R2_ACCESS_KEY_ID: "access-key",
			R2_SECRET_ACCESS_KEY: "secret-key",
			MEDIA_PUBLIC_URL: "https://media-dev.example.test",
		},
		{ client },
	);

	assert.equal(
		storage.getPublicUrl("assets/object.png"),
		"https://media-dev.example.test/assets/object.png",
	);
});

test("media storage selection rejects unsupported providers and incomplete R2 configuration", () => {
	assert.throws(
		() => createMediaStorageFromEnvironment({ OBJECT_STORAGE_PROVIDER: "filesystem" }),
		/Unsupported media storage provider: filesystem/,
	);
	assert.throws(
		() =>
			createMediaStorageFromEnvironment({
				OBJECT_STORAGE_PROVIDER: "r2",
				R2_BUCKET_NAME: "media-development",
			}),
		/R2_ENDPOINT is required/,
	);
});

test("production media storage cannot fall back to the local persistent adapter", () => {
	assert.throws(
		() => createMediaStorageFromEnvironment({ NODE_ENV: "production" }),
		/Production media storage requires OBJECT_STORAGE_PROVIDER=r2/,
	);
	assert.throws(
		() =>
			createMediaStorageFromEnvironment({
				NODE_ENV: "production",
				OBJECT_STORAGE_PROVIDER: "local",
			}),
		/Production media storage requires OBJECT_STORAGE_PROVIDER=r2/,
	);
});

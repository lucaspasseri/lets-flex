import assert from "node:assert/strict";
import test from "node:test";

import { compensateMediaStorageWrite, MediaStorageCleanupError } from "./storage.js";

test("media write compensation preserves the original error after cleanup succeeds", async () => {
	const original = new Error("database failed");
	let deletedKey;
	const storage = /** @type {any} */ ({
		async delete(storageKey) {
			deletedKey = storageKey;
		},
	});

	await assert.rejects(
		() => compensateMediaStorageWrite(storage, "assets/new.png", original),
		(error) => error === original,
	);
	assert.equal(deletedKey, "assets/new.png");
});

test("media write compensation raises a safe cleanup error when deletion fails", async () => {
	const storage = /** @type {any} */ ({
		async delete() {
			throw new Error("provider detail");
		},
	});

	await assert.rejects(
		() =>
			compensateMediaStorageWrite(
				storage,
				"assets/new.png",
				new Error("database failed"),
			),
		(error) =>
			error instanceof MediaStorageCleanupError &&
			error.message === "Media write failed and cleanup could not be confirmed." &&
			!error.message.includes("provider detail"),
	);
});

import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createCanonicalMediaManifestStore } from "./canonicalMediaManifestStore.js";

/** @typedef {import("./media.types.js").CanonicalMediaManifestEntry} CanonicalMediaManifestEntry */

const entry = /** @type {CanonicalMediaManifestEntry} */ ({
	entityType: "exercise",
	entityKey: "bench-press",
	path: "/media/catalog/exercises/bench-press.png",
	role: "primary",
	mimeType: "image/png",
	width: 640,
	height: 480,
	source: "curated",
	alt: "Bench press",
	altTexts: { en: "Bench press", "pt-BR": "Supino" },
});

test("canonical manifest store updates a project data file atomically and reads fresh state", async () => {
	const directory = await mkdtemp(path.join(os.tmpdir(), "lets-flex-manifest-"));
	const filePath = path.join(directory, "canonical-media.json");
	try {
		await writeFile(filePath, `${JSON.stringify([entry])}\n`);
		const store = createCanonicalMediaManifestStore({ filePath });
		const change = await store.update(
			(manifest) =>
				/** @type {ReadonlyArray<CanonicalMediaManifestEntry>} */ ([
					...manifest,
					{ ...entry, entityKey: "row", path: "/media/catalog/exercises/row.png" },
				]),
		);

		assert.equal(change.previous.length, 1);
		assert.equal((await store.read()).length, 2);
		assert.match(await readFile(filePath, "utf8"), /"entityKey": "row"/);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

test("canonical manifest store serializes concurrent updates", async () => {
	const directory = await mkdtemp(path.join(os.tmpdir(), "lets-flex-manifest-queue-"));
	const filePath = path.join(directory, "canonical-media.json");
	try {
		await writeFile(filePath, "[]\n");
		const store = createCanonicalMediaManifestStore({ filePath });
		await Promise.all([
			store.update(async (manifest) => {
				await new Promise((resolve) => setTimeout(resolve, 5));
				return /** @type {ReadonlyArray<CanonicalMediaManifestEntry>} */ ([
					...manifest,
					{ ...entry, entityKey: "first", path: "/media/first.png" },
				]);
			}),
			store.update(
				(manifest) =>
					/** @type {ReadonlyArray<CanonicalMediaManifestEntry>} */ ([
						...manifest,
						{ ...entry, entityKey: "second", path: "/media/second.png" },
					]),
			),
		]);

		assert.deepEqual(
			(await store.read()).map((value) => value.entityKey),
			["first", "second"],
		);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

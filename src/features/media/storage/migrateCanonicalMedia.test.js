import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createCanonicalMediaManifestStore } from "../canonicalMediaManifestStore.js";
import { migrateCanonicalMedia } from "./migrateCanonicalMedia.js";

const baseEntry = {
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
};

function createFakeStorage() {
	const objects = new Map();
	const calls = [];
	return {
		objects,
		calls,
		async put(buffer, options) {
			calls.push(["put", options.storageKey]);
			objects.set(options.storageKey, Buffer.from(buffer));
		},
		async delete(storageKey) {
			calls.push(["delete", storageKey]);
			objects.delete(storageKey);
		},
		async exists(storageKey) {
			calls.push(["exists", storageKey]);
			return objects.has(storageKey);
		},
		async read(storageKey) {
			calls.push(["read", storageKey]);
			return Buffer.from(objects.get(storageKey));
		},
	};
}

async function createFixture(entries = [baseEntry]) {
	const directory = await mkdtemp(path.join(os.tmpdir(), "lets-flex-media-migration-"));
	const publicDirectory = path.join(directory, "public");
	await mkdir(path.join(publicDirectory, "media/catalog/exercises"), {
		recursive: true,
	});
	await writeFile(
		path.join(publicDirectory, "media/catalog/exercises/bench-press.png"),
		"bench press bytes",
	);
	const manifestPath = path.join(directory, "canonical-media.json");
	await writeFile(manifestPath, `${JSON.stringify(entries)}\n`);
	return {
		directory,
		publicDirectory,
		manifestStore: createCanonicalMediaManifestStore({ filePath: manifestPath }),
	};
}

test("canonical migration uploads, verifies, and persists mappings without changing assignments", async () => {
	const fixture = await createFixture();
	try {
		const storage = createFakeStorage();
		const result = await migrateCanonicalMedia({
			...fixture,
			storage,
		});

		assert.deepEqual(result, { total: 1, uploaded: 1, reused: 0 });
		const manifest = await fixture.manifestStore.read();
		assert.equal(manifest[0].path, baseEntry.path);
		assert.ok(manifest[0].storageKey);
		assert.match(manifest[0].storageKey, /^assets\/[0-9a-f-]{36}\.png$/iu);
		assert.deepEqual(
			storage.calls.map(([operation]) => operation),
			["exists", "put", "exists", "read"],
		);
		assert.equal(
			(
				await readFile(path.join(fixture.publicDirectory, baseEntry.path.slice(1)))
			).toString(),
			"bench press bytes",
		);
	} finally {
		await rm(fixture.directory, { recursive: true, force: true });
	}
});

test("canonical migration reuses a matching mapped object on rerun", async () => {
	const fixture = await createFixture();
	try {
		const storage = createFakeStorage();
		await migrateCanonicalMedia({ ...fixture, storage });
		storage.calls.length = 0;
		const result = await migrateCanonicalMedia({ ...fixture, storage });

		assert.deepEqual(result, { total: 1, uploaded: 0, reused: 1 });
		assert.deepEqual(
			storage.calls.map(([operation]) => operation),
			["exists", "exists", "read"],
		);
	} finally {
		await rm(fixture.directory, { recursive: true, force: true });
	}
});

test("canonical migration preflights missing sources before any remote mutation", async () => {
	const missingEntry = { ...baseEntry, path: "/media/catalog/exercises/missing.png" };
	const fixture = await createFixture([missingEntry]);
	try {
		const storage = createFakeStorage();
		await assert.rejects(
			() => migrateCanonicalMedia({ ...fixture, storage }),
			/Canonical media migration source is missing for exercise "bench-press"/,
		);
		assert.deepEqual(storage.calls, []);
	} finally {
		await rm(fixture.directory, { recursive: true, force: true });
	}
});

test("canonical migration refuses to overwrite a mapped object with different bytes", async () => {
	const entry = { ...baseEntry, storageKey: "assets/019abc123.png" };
	const fixture = await createFixture([entry]);
	try {
		const storage = createFakeStorage();
		storage.objects.set(entry.storageKey, Buffer.from("different bytes"));
		await assert.rejects(
			() => migrateCanonicalMedia({ ...fixture, storage }),
			/different bytes.*refusing to overwrite/,
		);
		assert.deepEqual(
			storage.calls.map(([operation]) => operation),
			["exists", "exists", "read"],
		);
	} finally {
		await rm(fixture.directory, { recursive: true, force: true });
	}
});

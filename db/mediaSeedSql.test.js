import assert from "node:assert/strict";
import test from "node:test";

import { canonicalMediaManifest } from "../src/features/media/mediaManifest.js";
import {
	createMediaSeedSql,
	mediaSeedSql,
	validateCanonicalMediaManifest,
} from "./mediaSeedSql.js";

const cloneManifest = () =>
	/** @type {any} */ (structuredClone(canonicalMediaManifest));

test("canonical media manifest resolves all supported assignments through catalog keys", () => {
	assert.ok(canonicalMediaManifest.length > 5);
	assert.equal(
		new Set(canonicalMediaManifest.map((entry) => entry.path)).size,
		canonicalMediaManifest.length,
	);
	assert.match(mediaSeedSql, /INSERT INTO media_assets/);
	assert.match(mediaSeedSql, /INSERT INTO entity_media/);
	assert.match(mediaSeedSql, /INSERT INTO media_asset_alt_texts/);
	assert.match(
		mediaSeedSql,
		/FROM exercises WHERE catalog_key = curated_media\.catalog_key/,
	);
	assert.match(
		mediaSeedSql,
		/ FROM exercise_variants WHERE owner_user_id IS NULL AND catalog_key = curated_media\.catalog_key/,
	);
	assert.match(mediaSeedSql, /WHEN 'muscles'/);
	assert.match(mediaSeedSql, /WHEN 'equipments'/);
	assert.match(mediaSeedSql, /WHEN 'movement_patterns'/);
	assert.match(mediaSeedSql, /'barbell-bench-press'/);
	assert.match(mediaSeedSql, /'goblet-squat'/);
	assert.match(mediaSeedSql, /'rotation'/);
	assert.doesNotMatch(mediaSeedSql, /uploads\//);
});

test("media seed validates stable keys before generating SQL", () => {
	const invalidManifest = cloneManifest();
	invalidManifest[0].entityKey = "Bench Press";

	assert.throws(
		() => createMediaSeedSql(invalidManifest),
		/Failed to seed media: exercise_variant "Bench Press"; reason: stable entity key must be lowercase ASCII kebab-case/,
	);
});

test("media seed SQL fails clearly when a catalog key is absent", () => {
	const missingReferenceManifest = cloneManifest();
	missingReferenceManifest[0].entityKey = "missing-variant";

	const sql = createMediaSeedSql(missingReferenceManifest);
	assert.match(sql, /RAISE EXCEPTION 'Media seed references missing catalog keys: %'/);
	assert.match(sql, /\('exercise_variant', 'missing-variant', 'exercise_variants'\)/);
});

test("media seed rejects a missing canonical file before SQL generation", () => {
	const missingFileManifest = cloneManifest();
	missingFileManifest[0].path = "/media/catalog/exercise-variants/missing.svg";

	assert.throws(
		() => validateCanonicalMediaManifest(missingFileManifest),
		/Failed to seed media: exercise_variant "barbell-bench-press"; file: \/media\/catalog\/exercise-variants\/missing\.svg; reason: file does not exist/,
	);
});

test("media seed rejects conflicting duplicate primary assignments", () => {
	const duplicateManifest = cloneManifest();
	duplicateManifest.push({
		...duplicateManifest[0],
		path: "/media/exercise-barbell-bench-press-copy.svg",
	});

	assert.throws(
		() => validateCanonicalMediaManifest(duplicateManifest),
		/duplicate primary assignment conflicts with exercise_variant "barbell-bench-press"/,
	);
});

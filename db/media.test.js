import assert from "node:assert/strict";
import test from "node:test";

import { schemaSql } from "./schema.js";
import { mediaSchemaSql } from "./mediaSql.js";
import { mediaGenerationSchemaSql } from "./mediaGenerationSql.js";

test("media schema uses reusable assets and explicit supported entity assignments", () => {
	assert.match(mediaSchemaSql, /CREATE TABLE IF NOT EXISTS media_assets/);
	assert.match(mediaSchemaSql, /storage_key TEXT NOT NULL/);
	assert.match(mediaSchemaSql, /width INTEGER NOT NULL/);
	assert.match(mediaSchemaSql, /height INTEGER NOT NULL/);
	assert.match(mediaSchemaSql, /REFERENCES media_assets\(id\)/);
	assert.match(mediaSchemaSql, /CREATE TABLE IF NOT EXISTS media_asset_alt_texts/);
	assert.match(mediaSchemaSql, /locale IN \('en', 'pt-BR'\)/);
	assert.match(mediaSchemaSql, /UNIQUE \(storage_key\)/);
	assert.match(mediaSchemaSql, /UNIQUE \(entity_type, entity_id, role\)/);
	assert.match(
		mediaSchemaSql,
		/entity_type IN \('exercise', 'exercise_variant', 'muscle', 'equipment', 'movement_pattern'\)/,
	);
	assert.match(mediaSchemaSql, /role = 'primary'/);
	assert.ok(schemaSql.includes(mediaSchemaSql.trim()));
});

test("media assignments support removal without deleting reusable assets", () => {
	assert.match(mediaSchemaSql, /media_asset_id INTEGER NOT NULL/);
	assert.match(mediaSchemaSql, /ON DELETE RESTRICT/);
	assert.match(mediaSchemaSql, /entity_media_entity_id_positive/);
	assert.match(mediaSchemaSql, /entity_media_sort_order_valid/);
});

test("canonical reset removes the obsolete plural exercise-muscle table", () => {
	assert.match(schemaSql, /DROP TABLE IF EXISTS exercises_muscles CASCADE;/);
});

test("generated candidates remain distinct from approved media assets", () => {
	assert.match(
		mediaGenerationSchemaSql,
		/CREATE TABLE IF NOT EXISTS media_generation_candidates/,
	);
	assert.match(mediaGenerationSchemaSql, /pending_review', 'approved', 'rejected/);
	assert.match(
		mediaGenerationSchemaSql,
		/entity_type IN \('exercise', 'exercise_variant', 'equipment', 'movement_pattern'\)/,
	);
	assert.match(mediaGenerationSchemaSql, /REFERENCES media_assets\(id\)/);
	assert.match(mediaGenerationSchemaSql, /private_file_removed_at TIMESTAMPTZ/);
	assert.ok(schemaSql.includes(mediaGenerationSchemaSql.trim()));
});

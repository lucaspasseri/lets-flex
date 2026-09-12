import assert from "node:assert/strict";
import test from "node:test";

import getTranslationRecord from "./getTranslationRecord.js";
import { findTranslationRecordQuery, upsertTranslationQuery } from "./queries.js";
import updateTranslation, {
	TranslationMaintenanceNotFoundError,
} from "./updateTranslation.js";

function fakeDatabase(rows = []) {
	const calls = [];
	return {
		calls,
		async query(text, values) {
			calls.push({ text, values });
			return { rows };
		},
	};
}

test("editable record query scopes variants to active global catalog content", () => {
	const query = findTranslationRecordQuery("exercise_variant");
	assert.match(query, /JOIN exercises AS parent_entity/);
	assert.match(query, /parent_entity\.id = entity\.exercise_id/);
	assert.match(query, /entity\.owner_user_id IS NULL/);
	assert.match(query, /parent_entity\.is_archived = FALSE/);
	assert.match(query, /WHERE entity\.id = \$1/);
});

test("record mapping preserves the stable ID and exposes both translation values", async () => {
	const db = fakeDatabase([
		{
			id: 42,
			canonical_name: "Bench Press",
			english_name: "Bench Press",
			portuguese_name: null,
		},
	]);
	const record = await getTranslationRecord(
		{ entityType: "exercise", entityId: 42 },
		/** @type {any} */ (db),
	);
	assert.ok(record);
	assert.equal(record.id, 42);
	assert.equal(record.canonicalName, "Bench Press");
	assert.equal(record.status, "missing-pt-BR");
	assert.equal(record.preview.portuguese.value, "Bench Press");
	assert.deepEqual(db.calls[0].values, [42]);
});

test("translation upsert updates one locale without allowing duplicate pairs", async () => {
	const db = fakeDatabase([{ entity_id: 42, locale: "pt-BR", name: "Supino reto" }]);
	const result = await updateTranslation(
		{
			entityType: "exercise",
			entityId: 42,
			locale: "pt-BR",
			name: " Supino reto ",
		},
		/** @type {any} */ (db),
	);
	assert.deepEqual(result, { entity_id: 42, locale: "pt-BR", name: "Supino reto" });
	assert.deepEqual(db.calls[0].values, [42, "pt-BR", "Supino reto"]);
	assert.match(
		upsertTranslationQuery("exercise"),
		/ON CONFLICT \(exercise_id, locale\)/,
	);
	assert.match(
		upsertTranslationQuery("exercise"),
		/DO UPDATE SET name = EXCLUDED\.name/,
	);
});

test("translation upsert rejects unavailable or unsupported records without deleting rows", async () => {
	const db = fakeDatabase();
	await assert.rejects(
		() =>
			updateTranslation(
				{ entityType: "exercise", entityId: 42, locale: "en", name: "Bench Press" },
				/** @type {any} */ (db),
			),
		TranslationMaintenanceNotFoundError,
	);
	assert.equal(db.calls.length, 1);
	assert.doesNotMatch(db.calls[0].text, /DELETE/);
	await assert.rejects(
		() =>
			updateTranslation(
				{ entityType: "exercise", entityId: 42, locale: "fr-FR", name: "Supino" },
				/** @type {any} */ (db),
			),
		/error|supported/i,
	);
	assert.equal(db.calls.length, 1);
});

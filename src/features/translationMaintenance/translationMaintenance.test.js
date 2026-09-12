import assert from "node:assert/strict";
import test from "node:test";

import getTranslationOverview from "./getTranslationOverview.js";
import { findOverviewRows } from "./repository.js";
import { findTranslationOverviewQuery } from "./queries.js";
import { TranslationMaintenanceValidationError } from "./translationMaintenanceContract.js";

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

test("translation overview query covers only active global catalog records", () => {
	const query = findTranslationOverviewQuery();
	assert.equal((query.match(/UNION ALL/g) ?? []).length, 4);
	assert.match(query, /exercise_translations/);
	assert.match(query, /exercise_variant_translations/);
	assert.match(query, /muscle_translations/);
	assert.match(query, /equipment_translations/);
	assert.match(query, /movement_pattern_translations/);
	assert.match(query, /exercises\.is_archived = FALSE/);
	assert.match(query, /exercise_variants\.owner_user_id IS NULL/);
	assert.match(query, /canonical_name ILIKE \$2/);
	assert.match(query, /english_name ILIKE \$2/);
	assert.match(query, /portuguese_name ILIKE \$2/);
});

test("repository normalizes entity and search filters into parameterized values", async () => {
	const db = fakeDatabase();
	await findOverviewRows(
		{ entityType: "exercise", search: " Bench " },
		/** @type {any} */ (db),
	);
	assert.deepEqual(db.calls[0].values, ["exercise", "%Bench%"]);
});

test("overview filters reject unsupported entity, status, and oversized search values", async () => {
	const db = fakeDatabase();
	for (const input of [
		{ entityType: "session" },
		{ status: "translated" },
		{ search: "x".repeat(101) },
	]) {
		await assert.rejects(
			() => findOverviewRows(input, /** @type {any} */ (db)),
			TranslationMaintenanceValidationError,
		);
	}
	assert.equal(db.calls.length, 0);
});

test("overview derives filtered statuses and counts through the shared contract", async () => {
	const db = fakeDatabase([
		{
			entity_type: "exercise",
			id: 42,
			canonical_name: "Bench Press",
			english_name: "Bench Press",
			portuguese_name: "Supino reto",
		},
		{
			entity_type: "exercise",
			id: 43,
			canonical_name: "Deadlift",
			english_name: "Deadlift",
			portuguese_name: null,
		},
		{
			entity_type: "muscle",
			id: 3,
			canonical_name: "Chest",
			english_name: null,
			portuguese_name: "Peito",
		},
	]);

	const overview = await getTranslationOverview(
		{ status: "missing-pt-BR" },
		/** @type {any} */ (db),
	);
	assert.deepEqual(overview.filters, {
		entityType: null,
		status: "missing-pt-BR",
		search: null,
	});
	assert.deepEqual(
		overview.records.map(({ id, status }) => ({ id, status })),
		[{ id: 43, status: "missing-pt-BR" }],
	);
	assert.equal(overview.summary.total, 1);
	assert.equal(overview.summary.statusCounts["missing-pt-BR"], 1);
	assert.equal(overview.summary.entityCounts.exercise.total, 1);
	assert.equal(overview.summary.entityCounts.muscle.total, 0);
});

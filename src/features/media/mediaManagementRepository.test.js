import assert from "node:assert/strict";
import test from "node:test";

import { findMediaManagementEntityOptions } from "./mediaManagementRepository.js";

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

test("entity options apply an optional type filter and case-insensitive partial search", async () => {
	const db = fakeDatabase([
		{ entity_type: "muscle", entity_id: 4, name: "Pectoralis Major" },
	]);

	const options = await findMediaManagementEntityOptions(
		{ locale: "en", entityType: "muscle", search: " PecTor " },
		/** @type {any} */ (db),
	);

	assert.deepEqual(options, [
		{ entity_type: "muscle", entity_id: 4, name: "Pectoralis Major" },
	]);
	assert.equal(db.calls.length, 1);
	assert.match(db.calls[0].text, /FROM muscles AS entity/);
	assert.match(db.calls[0].text, /ILIKE \$2/);
	assert.deepEqual(db.calls[0].values, ["en", "%PecTor%", 100]);
});

test("entity options use every supported type when the optional type filter is empty", async () => {
	const db = fakeDatabase();

	await findMediaManagementEntityOptions(
		{ locale: "pt-BR", entityType: "", search: "bar" },
		/** @type {any} */ (db),
	);

	assert.equal(db.calls.length, 5);
	assert.deepEqual(db.calls[0].values, ["pt-BR", "%bar%", 100]);
	assert.match(
		db.calls.map((call) => call.text).join("\n"),
		/FROM exercises AS entity/,
	);
	assert.match(
		db.calls.map((call) => call.text).join("\n"),
		/FROM movement_patterns AS entity/,
	);
});

test("entity options return a useful empty result without changing selection behavior", async () => {
	const db = fakeDatabase([]);
	const options = await findMediaManagementEntityOptions(
		{ entityType: "equipment", search: "does-not-exist" },
		/** @type {any} */ (db),
	);

	assert.deepEqual(options, []);
	assert.equal(db.calls.length, 1);
	assert.match(db.calls[0].text, /FROM equipments AS entity/);
});

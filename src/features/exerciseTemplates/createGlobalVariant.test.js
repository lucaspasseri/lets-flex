import assert from "node:assert/strict";
import test from "node:test";
import { createGlobalVariant } from "./createGlobalVariant.js";

function createDependencies({ variant = { id: 12 }, failTranslation = false } = {}) {
	/** @type {any[]} */
	const calls = [];
	const client = {
		async query(sql) {
			calls.push(sql);
		},
		release() {
			calls.push("RELEASE");
		},
	};
	return {
		calls,
		dependencies: {
			pool: {
				async connect() {
					return client;
				},
			},
			exerciseVariantsRepository: {
				async createGlobal(received, db) {
					calls.push(["variant", received, db]);
					return variant;
				},
			},
			translationMaintenanceRepository: {
				async upsertTranslation(received, db) {
					calls.push(["translation", received, db]);
					if (failTranslation) throw new Error("translation failed");
					return received;
				},
			},
		},
	};
}

test("global variant creation commits its English translation atomically", async () => {
	const { calls, dependencies } = createDependencies();
	const result = await createGlobalVariant(
		{ name: "Dumbbell row", exerciseId: 7, equipmentId: 4 },
		dependencies,
	);

	assert.deepEqual(result, { id: 12 });
	assert.deepEqual(
		calls.filter((call) => typeof call === "string"),
		["BEGIN", "COMMIT", "RELEASE"],
	);
	assert.deepEqual(
		calls.find((call) => Array.isArray(call) && call[0] === "translation")[1],
		{
			entityType: "exercise_variant",
			entityId: 12,
			locale: "en",
			name: "Dumbbell row",
		},
	);
});

test("global variant translation failure rolls the variant transaction back", async () => {
	const { calls, dependencies } = createDependencies({ failTranslation: true });
	await assert.rejects(
		createGlobalVariant(
			{ name: "Dumbbell row", exerciseId: 7, equipmentId: 4 },
			dependencies,
		),
		/translation failed/,
	);
	assert.deepEqual(
		calls.filter((call) => typeof call === "string"),
		["BEGIN", "ROLLBACK", "RELEASE"],
	);
});

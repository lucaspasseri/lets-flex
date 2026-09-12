import assert from "node:assert/strict";
import test from "node:test";
import { createExerciseTemplate } from "./createExerciseTemplate.js";

const input = {
	name: "Bench press",
	movementPatternId: 2,
	equipmentId: 4,
	muscleGroup: [{ muscleId: 3, muscleRoleId: 1 }],
	createdByUserId: 9,
};

function createDependencies({ variant = { id: 11 }, failTranslation = false } = {}) {
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
			exercisesRepository: {
				async create(received, db) {
					calls.push(["exercise", received, db]);
					return { id: 7 };
				},
			},
			exerciseMusclesRepository: {
				async create(received, db) {
					calls.push(["muscle", received, db]);
				},
			},
			exerciseVariantsRepository: {
				async create(received, db) {
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

test("global exercise creation commits canonical rows and English translations together", async () => {
	const { calls, dependencies } = createDependencies();
	const result = await createExerciseTemplate(input, dependencies);

	assert.deepEqual(result, { exercise: { id: 7 }, variant: { id: 11 } });
	assert.deepEqual(
		calls
			.filter((call) => Array.isArray(call) && call[0] === "translation")
			.map((call) => call[1]),
		[
			{ entityType: "exercise", entityId: 7, locale: "en", name: "Bench press" },
			{
				entityType: "exercise_variant",
				entityId: 11,
				locale: "en",
				name: "Bench press",
			},
		],
	);
	assert.deepEqual(
		calls.filter((call) => typeof call === "string"),
		["BEGIN", "COMMIT", "RELEASE"],
	);
});

test("translation failure rolls global exercise creation back", async () => {
	const { calls, dependencies } = createDependencies({ failTranslation: true });
	await assert.rejects(
		createExerciseTemplate(input, dependencies),
		/Failed to create exercise template/,
	);
	assert.deepEqual(
		calls.filter((call) => typeof call === "string"),
		["BEGIN", "ROLLBACK", "RELEASE"],
	);
});

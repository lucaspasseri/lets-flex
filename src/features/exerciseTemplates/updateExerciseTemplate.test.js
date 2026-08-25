import test from "node:test";
import assert from "node:assert/strict";
import updateExerciseTemplate, {
	ExerciseTemplateNotFoundError,
} from "./updateExerciseTemplate.js";

const input = {
	exerciseId: 7,
	variantId: 11,
	name: "Updated press",
	movementPatternId: 2,
	equipmentId: 4,
	muscleGroup: [
		{ muscleId: 3, muscleRoleId: 1 },
		{ muscleId: 9, muscleRoleId: 2 },
	],
};

function createDependencies({ variantExists = true, failCreateAt = 0 } = {}) {
	/** @type {any[]} */
	const calls = [];
	let createCount = 0;
	const client = {
		async query(/** @type {any} */ sql) { calls.push(sql); },
		release() { calls.push("RELEASE"); },
	};
	return {
		calls,
		dependencies: {
			pool: { async connect() { return client; } },
			exerciseVariantsRepository: {
				async update(/** @type {any} */ received, /** @type {any} */ db) {
					calls.push(["variant", received, db]);
					return variantExists;
				},
			},
			exercisesRepository: {
				async update(/** @type {any} */ received, /** @type {any} */ db) {
					calls.push(["exercise", received, db]);
					return true;
				},
			},
			exerciseMusclesRepository: {
				async deleteByExerciseId(/** @type {any} */ received, /** @type {any} */ db) {
					calls.push(["delete-muscles", received, db]);
				},
				async create(/** @type {any} */ received, /** @type {any} */ db) {
					createCount += 1;
					calls.push(["create-muscle", received, db]);
					if (createCount === failCreateAt) throw new Error("insert failed");
				},
			},
		},
	};
}

test("valid update synchronizes every muscle relationship and commits", async () => {
	const { calls, dependencies } = createDependencies();
	await updateExerciseTemplate(input, dependencies);

	assert.deepEqual(calls.filter(call => Array.isArray(call) && call[0] === "create-muscle").map(call => call[1]), [
		{ exerciseId: 7, muscleId: 3, muscleRoleId: 1 },
		{ exerciseId: 7, muscleId: 9, muscleRoleId: 2 },
	]);
	assert.deepEqual(calls.filter(call => typeof call === "string"), ["BEGIN", "COMMIT", "RELEASE"]);
});

test("a nonexistent exercise template rolls back and reports not found", async () => {
	const { calls, dependencies } = createDependencies({ variantExists: false });
	await assert.rejects(
		updateExerciseTemplate(input, dependencies),
		ExerciseTemplateNotFoundError,
	);
	assert.deepEqual(calls.filter(call => typeof call === "string"), ["BEGIN", "ROLLBACK", "RELEASE"]);
});

test("a failed related write rolls the whole update transaction back", async () => {
	const { calls, dependencies } = createDependencies({ failCreateAt: 2 });
	await assert.rejects(updateExerciseTemplate(input, dependencies), /insert failed/);
	assert.equal(calls.includes("COMMIT"), false);
	assert.deepEqual(calls.filter(call => typeof call === "string"), ["BEGIN", "ROLLBACK", "RELEASE"]);
});

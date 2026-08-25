import test from "node:test";
import assert from "node:assert/strict";
import updateSessionTemplate, { SessionTemplateNotFoundError } from "./updateSessionTemplate.js";

const input = {
	sessionId: 5,
	name: "Updated session",
	notes: null,
	stepRow: [
		{ stepId: 12, stepTypeId: 1, exerciseVariantId: 8, sets: 4, reps: 6, loadValue: 50, loadUnit: "Kilograms" },
		{ stepTypeId: 1, exerciseVariantId: 9, sets: 3, reps: 10, loadValue: 20, loadUnit: "Pounds" },
	],
};

function createDependencies({ sessionExists = true, existingStepExists = true, failCreate = false } = {}) {
	/** @type {any[]} */
	const calls = [];
	const client = { async query(/** @type {any} */ sql) { calls.push(sql); }, release() { calls.push("RELEASE"); } };
	return {
		calls,
		dependencies: {
			pool: { async connect() { return client; } },
			sessionsRepository: {
				async update(/** @type {any} */ received, /** @type {any} */ db) { calls.push(["session", received, db]); return sessionExists; },
			},
			sessionStepsRepository: {
				async moveOrdersOutOfWay(/** @type {any} */ received, /** @type {any} */ db) { calls.push(["move-orders", received, db]); },
				async update(/** @type {any} */ received, /** @type {any} */ db) { calls.push(["update-step", received, db]); return existingStepExists; },
				async create(/** @type {any} */ received, /** @type {any} */ db) { calls.push(["create-step", received, db]); if (failCreate) throw new Error("step failed"); return { id: 20 }; },
				async deleteExcept(/** @type {any} */ received, /** @type {any} */ db) { calls.push(["delete-except", received, db]); },
			},
		},
	};
}

test("session update preserves retained step identities and synchronizes order, additions, and removals", async () => {
	const { calls, dependencies } = createDependencies();
	await updateSessionTemplate(input, /** @type {any} */ (dependencies));
	const retained = calls.find(call => Array.isArray(call) && call[0] === "update-step")[1];
	const added = calls.find(call => Array.isArray(call) && call[0] === "create-step")[1];
	const cleanup = calls.find(call => Array.isArray(call) && call[0] === "delete-except")[1];
	assert.equal(retained.stepId, 12);
	assert.equal(retained.stepOrder, 1);
	assert.equal(added.stepOrder, 2);
	assert.deepEqual(cleanup, { sessionId: 5, stepIds: [12, 20] });
	assert.deepEqual(calls.filter(call => typeof call === "string"), ["BEGIN", "COMMIT", "RELEASE"]);
});

test("missing sessions and stale step identities return not found and roll back", async () => {
	for (const options of [{ sessionExists: false }, { existingStepExists: false }]) {
		const { calls, dependencies } = createDependencies(options);
		await assert.rejects(updateSessionTemplate(input, /** @type {any} */ (dependencies)), SessionTemplateNotFoundError);
		assert.deepEqual(calls.filter(call => typeof call === "string"), ["BEGIN", "ROLLBACK", "RELEASE"]);
	}
});

test("a related step failure rolls the aggregate update back", async () => {
	const { calls, dependencies } = createDependencies({ failCreate: true });
	await assert.rejects(updateSessionTemplate(input, /** @type {any} */ (dependencies)), /step failed/);
	assert.equal(calls.includes("COMMIT"), false);
	assert.deepEqual(calls.filter(call => typeof call === "string"), ["BEGIN", "ROLLBACK", "RELEASE"]);
});

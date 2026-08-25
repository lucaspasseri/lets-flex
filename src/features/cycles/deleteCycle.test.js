import test from "node:test";
import assert from "node:assert/strict";
import deleteCycle, { CycleNotFoundError } from "./deleteCycle.js";

function dependencies(
	/** @type {any} */
	deleted = { id: 8, program_id: 4, cycle_order: 2, cycle_size: 7 },
) {
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
		value: {
			pool: {
				async connect() {
					return client;
				},
			},
			cyclesRepository: {
				async deleteByIdForUser(input, db) {
					calls.push(["delete", input, db]);
					return deleted;
				},
				async closeCycleOrderGap(input, db) {
					calls.push(["close-gap", input, db]);
				},
			},
			trainingDaysRepository: {
				async shiftScheduledDates(input, db) {
					calls.push(["shift-dates", input, db]);
				},
			},
		},
	};
}

test("deleteCycle removes dependents and closes the calendar gap atomically", async () => {
	const fixture = dependencies();
	await deleteCycle({ cycleId: 8, userId: 2 }, fixture.value);
	assert.equal(fixture.calls[0], "BEGIN");
	assert.deepEqual(fixture.calls[2][1], {
		programId: 4,
		cycleOrder: 2,
		amountOfDays: -7,
	});
	assert.deepEqual(fixture.calls[3][1], { programId: 4, cycleOrder: 2 });
	assert.deepEqual(fixture.calls.slice(-2), ["COMMIT", "RELEASE"]);
});

test("deleteCycle rolls back missing or unowned cycles", async () => {
	const fixture = dependencies(null);
	await assert.rejects(
		deleteCycle({ cycleId: 8, userId: 9 }, fixture.value),
		CycleNotFoundError,
	);
	assert.deepEqual(fixture.calls.slice(-2), ["ROLLBACK", "RELEASE"]);
});

test("deleteCycle rolls back database failures", async () => {
	const fixture = dependencies();
	const failure = new Error("database unavailable");
	fixture.value.cyclesRepository.deleteByIdForUser = async () => {
		throw failure;
	};
	await assert.rejects(
		deleteCycle({ cycleId: 8, userId: 2 }, fixture.value),
		(error) => error === failure,
	);
	assert.deepEqual(fixture.calls.slice(-2), ["ROLLBACK", "RELEASE"]);
});

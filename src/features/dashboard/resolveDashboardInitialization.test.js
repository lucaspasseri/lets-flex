import assert from "node:assert/strict";
import test from "node:test";
import resolveDashboardInitialization from "./resolveDashboardInitialization.js";

test("Dashboard restores the owner-scoped starter selection when session state is empty", async () => {
	const result = await resolveDashboardInitialization({
		userId: 7,
		sessionState: { locale: "pt-BR" },
		async findStarterWorkspace(input) {
			assert.deepEqual(input, {
				userId: 7,
				provisioningKey: "starter-training-v1",
			});
			return {
				program_id: 11,
				cycle_id: 12,
				training_day_id: 13,
				workout_session_id: 14,
			};
		},
	});

	assert.deepEqual(result, {
		programId: 11,
		sessionState: {
			locale: "pt-BR",
			programId: 11,
			cycleId: 12,
			dayId: 13,
		},
	});
});

test("Dashboard preserves an existing deliberate program selection", async () => {
	const sessionState = { programId: 21, cycleId: 22, dayId: 23 };
	let queried = false;
	const result = await resolveDashboardInitialization({
		userId: 7,
		sessionState,
		async findStarterWorkspace() {
			queried = true;
			return null;
		},
	});

	assert.equal(queried, false);
	assert.deepEqual(result, { programId: 21, sessionState });
});

test("Dashboard keeps the empty state for owners without a starter workspace", async () => {
	const result = await resolveDashboardInitialization({
		userId: 7,
		sessionState: {},
		async findStarterWorkspace() {
			return null;
		},
	});

	assert.deepEqual(result, { programId: null, sessionState: {} });
});

test("Dashboard does not query or create selections for anonymous visitors", async () => {
	const result = await resolveDashboardInitialization({
		userId: null,
		sessionState: {},
		async findStarterWorkspace() {
			assert.fail("anonymous Dashboard initialization must not query owner data");
		},
	});

	assert.deepEqual(result, { programId: null, sessionState: {} });
});

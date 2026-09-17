import assert from "node:assert/strict";
import test from "node:test";

import provisionStarterTraining from "./provisionStarterTraining.js";
import { starterWorkoutManifest } from "./starterWorkoutManifest.js";

/** @param {any} [existing] @returns {any} */
function createDependencies(existing = null) {
	const calls = [];
	return {
		calls,
		usersRepository: {
			async findPrincipalByIdForUpdate(input) {
				calls.push(["lockOwner", input]);
				return { id: input.userId, role: "admin" };
			},
		},
		programsRepository: {
			async findStarterWorkspace(input) {
				calls.push(["findStarter", input]);
				return existing;
			},
			async create(input) {
				calls.push(["createProgram", input]);
				return { id: 11 };
			},
		},
		goalsRepository: {
			async findByName(input) {
				calls.push(["findGoal", input]);
				return { id: 12 };
			},
		},
		sessionsRepository: {
			async findActiveGlobalByName(input) {
				calls.push(["findTemplate", input]);
				return { id: 13 };
			},
			async createOwnedCopy(input) {
				calls.push(["copySession", input]);
				return { id: 14 };
			},
		},
		cyclesRepository: {
			async create(input) {
				calls.push(["createCycle", input]);
				return { id: 15 };
			},
		},
		trainingDaysRepository: {
			async create(input) {
				calls.push(["createDay", input]);
				return { id: 16 };
			},
		},
		workoutSessionsRepository: {
			async createForUser(input) {
				calls.push(["createWorkout", input]);
				return { id: 17 };
			},
		},
	};
}

test("provisions every hierarchy layer from the shared starter definition", async () => {
	const dependencies = createDependencies();
	const result = await provisionStarterTraining(
		{ userId: 7, scheduledDate: "2026-09-16" },
		{},
		dependencies,
	);

	assert.deepEqual(result, {
		programId: 11,
		cycleId: 15,
		trainingDayId: 16,
		workoutSessionId: 17,
	});
	assert.deepEqual(dependencies.calls[2], ["findGoal", { name: "general_fitness" }]);
	assert.deepEqual(dependencies.calls[3], [
		"findTemplate",
		{ name: starterWorkoutManifest.sessionName },
	]);
	assert.deepEqual(dependencies.calls[5], [
		"createProgram",
		{
			name: starterWorkoutManifest.programName,
			userId: 7,
			goalId: 12,
			startDate: "2026-09-16",
			provisioningKey: starterWorkoutManifest.provisioningKey,
		},
	]);
});

test("returns the existing owner-scoped hierarchy without creating duplicates", async () => {
	const existing = {
		program_id: 21,
		cycle_id: 22,
		training_day_id: 23,
		workout_session_id: 24,
		session_id: 25,
	};
	const dependencies = createDependencies(existing);

	const result = await provisionStarterTraining({ userId: 7 }, {}, dependencies);

	assert.deepEqual(result, {
		programId: 21,
		cycleId: 22,
		trainingDayId: 23,
		workoutSessionId: 24,
	});
	assert.deepEqual(dependencies.calls, [
		["lockOwner", { userId: 7 }],
		[
			"findStarter",
			{ userId: 7, provisioningKey: starterWorkoutManifest.provisioningKey },
		],
	]);
});

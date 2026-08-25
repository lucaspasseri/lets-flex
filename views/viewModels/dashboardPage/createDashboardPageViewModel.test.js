import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import ejs from "ejs";
import createDashboardPageViewModel from "./createDashboardPageViewModel.js";

const page = { path: "/", title: "Let's Flex!" };
const user = { id: 1, name: "Lucas", dateOfBirth: null, anamnesis: null };
const program = {
	id: 2,
	userId: 1,
	goalId: null,
	name: "Strength",
	startDate: new Date(2026, 7, 17),
};
const cycle = { id: 3, programId: 2, name: "Base", size: 7, order: 1 };
const trainingDay = {
	id: 4,
	cycleId: 3,
	programId: 2,
	cycleOrder: 1,
	dayOrder: 4,
	scheduledDate: new Date(2026, 7, 20),
	label: null,
};
const workout = {
	id: 5,
	trainingDayId: 4,
	sessionId: 6,
	order: 1,
	status: "in_progress",
	startedAt: new Date(),
	finishedAt: null,
	scheduledDate: new Date(2026, 7, 20),
	notes: null,
	name: "Push",
	sessionNotes: "Template notes",
	isArchived: false,
	steps: [
		{
			id: 7,
			name: "Press",
			order: 1,
			type: "Exercise",
			sets: 3,
			reps: 8,
			loadValue: 60,
			loadUnit: "Kilograms",
			movementPattern: "Push",
			exercise: {
				name: "Bench press",
				variantName: "Barbell",
				setupDescription: "",
				environment: "Gym",
				notes: "",
			},
			equipment: { name: "Barbell", category: "Free weight" },
			muscles: [],
			stepLog: {
				id: 8,
				workoutSessionId: 5,
				sessionStepId: 7,
				status: "planned",
				performedAt: null,
				plannedSets: 3,
				plannedReps: 8,
				plannedLoadValue: 60,
				plannedLoadUnit: "Kilograms",
				performedSets: null,
				performedReps: null,
				performedLoadValue: null,
				performedLoadUnit: null,
			},
		},
	],
};

test("dashboard page exposes explicit component contracts and renders without legacy data", async () => {
	const result = createDashboardPageViewModel({
		page,
		pageState: { userId: 1, programId: 2, daysDifference: 0, workoutSessionId: 999 },
		data: {
			currentUser: user,
			currentProgram: program,
			selectedDate: new Date(2026, 7, 20),
			currentTrainingDay: trainingDay,
			currentCycle: cycle,
			cycles: [cycle],
			workoutSessions: [workout],
			currentDayWorkoutSessions: [workout],
			selectedWorkoutSession: workout,
			heatmap: [
				{
					cycleId: 3,
					cycleName: "Base",
					days: [
						{
							date: new Date(2026, 7, 20),
							dateLabel: "20/08",
							offset: 4,
							intensity: "one",
						},
					],
				},
			],
			barChart: [
				{
					date: new Date(2026, 7, 17),
					label: "17/08",
					scheduledCount: 1,
					finishedCount: 0,
				},
			],
		},
	});

	assert.equal(result.pageState.workoutSessionId, 5);
	assert.equal(result.components.programBanner.programName, "Strength");
	assert.equal(result.components.dateNavigation.days.length, 7);
	assert.equal(
		result.components.dateNavigation.days[3].statusMarkers.items[0].label,
		"In progress",
	);
	assert.equal(result.components.currentWorkout.performedPercentage, 0);
	assert.equal(
		result.components.currentWorkout.session?.steps[0].title,
		"PRESS (Barbell)",
	);
	assert.equal(result.components.currentWorkout.session?.steps[0].isCurrent, true);
	assert.deepEqual(result.components.barChart.labels, ["17/08"]);
	assert.equal(
		result.components.heatmap.cycles[0].days[0].cellClass,
		"one-workout-session",
	);
	assert.equal("appState" in result, false);
	assert.equal("data" in result, false);

	const renderFile =
		/** @type {(filename: string, data: object) => Promise<string>} */ (ejs.renderFile);
	const html = await renderFile(path.resolve("views/index.ejs"), {
		...result,
		contentFor: () => "",
	});
	assert.match(html, /data-dashboard-page/);
	assert.match(html, /CURRENT WORKOUT SESSION/);
	assert.match(html, /action="\/workout_step_logs\/8\/perform"/);
	assert.match(html, /session-step--current/);
	assert.match(html, /aria-label="Planned"/);
	assert.match(html, /shared-button/);
	assert.match(html, /session-status-marker--in-progress/);
	assert.match(html, /Workout session: In progress/);
	assert.doesNotMatch(html, /training_day_id|scheduled_date|finished_at|cycle_id/);
});

test("dashboard page makes empty states explicit", async () => {
	const result = createDashboardPageViewModel({
		page,
		pageState: {
			userId: null,
			programId: null,
			daysDifference: null,
			workoutSessionId: null,
		},
		data: {
			currentUser: null,
			currentProgram: null,
			selectedDate: new Date(2026, 7, 20),
			currentTrainingDay: null,
			currentCycle: null,
			cycles: [],
			workoutSessions: [],
			currentDayWorkoutSessions: [],
			selectedWorkoutSession: null,
			heatmap: [],
			barChart: [],
		},
	});

	assert.equal(result.components.status.isVisible, true);
	assert.equal(result.components.status.userEmptyState.isVisible, true);
	assert.equal(result.components.currentWorkout.isRestDay, true);
	assert.equal(result.components.barChart.isVisible, false);
	const renderFile =
		/** @type {(filename: string, data: object) => Promise<string>} */ (ejs.renderFile);
	const html = await renderFile(path.resolve("views/index.ejs"), {
		...result,
		contentFor: () => "",
	});
	assert.match(html, /NO ACTIVE USER/);
	assert.match(html, /NO ACTIVE PROGRAM/);
	assert.doesNotMatch(html, /bar-chart-canvas/);
});

test("workout component states are decided before rendering", () => {
	/** @param {import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession} selectedWorkoutSession @param {import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession[]} [currentDayWorkoutSessions] */
	const build = (
		selectedWorkoutSession,
		currentDayWorkoutSessions = [selectedWorkoutSession],
	) =>
		createDashboardPageViewModel({
			page,
			pageState: {
				userId: 1,
				programId: 2,
				daysDifference: 0,
				workoutSessionId: selectedWorkoutSession.id,
			},
			data: {
				currentUser: user,
				currentProgram: program,
				selectedDate: new Date(2026, 7, 20),
				currentTrainingDay: trainingDay,
				currentCycle: cycle,
				cycles: [cycle],
				workoutSessions: currentDayWorkoutSessions,
				currentDayWorkoutSessions,
				selectedWorkoutSession,
				heatmap: [],
				barChart: [],
			},
		}).components.currentWorkout;

	const planned = build({ ...workout, status: "planned" });
	assert.equal(planned.session?.showStart, true);
	assert.equal(planned.session?.startForm.action, "/workout_sessions/5/start");

	const missingLogs = build({
		...workout,
		steps: workout.steps.map((step) => ({ ...step, stepLog: null })),
	});
	assert.equal(missingLogs.session?.showMissingLogs, true);
	assert.equal(missingLogs.session?.showFinish, false);

	const second = { ...workout, id: 9, order: 2 };
	const multiple = build(workout, [workout, second]);
	assert.equal(multiple.hasMultipleSessions, true);
	assert.deepEqual(
		multiple.selectors.map((item) => item.isActive),
		[true, false],
	);
});

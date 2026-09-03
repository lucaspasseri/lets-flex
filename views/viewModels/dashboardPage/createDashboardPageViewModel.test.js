import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import ejs from "ejs";
import createDashboardPageViewModel from "./createDashboardPageViewModel.js";
import createWorkoutSessionViewModel from "./createWorkoutSessionViewModel.js";

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
	assert.match(html, /<span>Planned<\/span>/);
	assert.match(html, /<progress value="0" max="1">0%<\/progress>/);
	assert.match(html, /fieldset class="form-row" data-set-row/);
	assert.match(html, /data-action="add-set"/);
	assert.doesNotMatch(html, /aria-describedby=""/);
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

test("workout component exposes lifecycle-safe controls and resolved progress", () => {
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
	assert.equal(planned.session?.currentStep, null);

	const performedStep = {
		...workout.steps[0],
		id: 10,
		order: 1,
		stepLog: { ...workout.steps[0].stepLog, id: 11, status: "performed" },
	};
	const skippedStep = {
		...workout.steps[0],
		id: 12,
		order: 2,
		stepLog: { ...workout.steps[0].stepLog, id: 13, status: "skipped" },
	};
	const plannedStep = {
		...workout.steps[0],
		id: 14,
		order: 3,
		stepLog: { ...workout.steps[0].stepLog, id: 15, status: "planned" },
	};
	const progressing = build({
		...workout,
		steps: [performedStep, skippedStep, plannedStep],
	});
	assert.deepEqual(progressing.session?.progress, {
		isVisible: true,
		value: 2,
		max: 3,
		percentage: 67,
		label: "2 of 3 steps resolved",
		detail: "1 completed · 1 skipped · 1 remaining",
	});
	assert.equal(progressing.session?.currentStep?.positionLabel, "Step 3 of 3");

	const finished = build({
		...workout,
		status: "finished",
		steps: [performedStep, skippedStep],
	});
	assert.equal(finished.session?.currentStep, null);
	assert.equal(finished.session?.showFinish, false);
	assert.equal(finished.session?.terminalState?.title, "Workout complete");
	assert.equal(finished.session?.progress.value, 2);

	const cancelled = build({ ...workout, status: "cancelled" });
	assert.equal(cancelled.session?.showStart, false);
	assert.equal(cancelled.session?.currentStep, null);
	assert.equal(cancelled.session?.terminalState?.title, "Session cancelled");

	const emptyPlanned = build({ ...workout, status: "planned", steps: [] });
	assert.equal(emptyPlanned.session?.showStart, true);
	assert.equal(emptyPlanned.session?.emptyState.title, "No steps planned");
	const emptyActive = build({ ...workout, steps: [] });
	assert.equal(emptyActive.session?.showFinish, true);
	assert.equal(emptyActive.session?.emptyState.title, "Nothing to log");

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

test("workout validation preserves safe set values and presents associated feedback", async () => {
	const submittedRows = Array.from({ length: 101 }, (_, index) => ({
		performedReps: String(index),
		performedLoadValue: index === 0 ? "27.5" : "",
		performedLoadUnit: "Kilograms",
	}));
	const result = createDashboardPageViewModel({
		page,
		pageState: { userId: 1, programId: 2, daysDifference: 0, workoutSessionId: 5 },
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
			heatmap: [],
			barChart: [],
		},
		workoutLogFormState: {
			values: { logFormRows: submittedRows },
			errors: {
				formErrors: [],
				fieldErrors: {
					"logFormRows.0.performedReps": "Enter a valid number of reps.",
					logFormRows: "A step cannot contain more than 100 sets.",
				},
			},
		},
	});
	const currentStep = result.components.currentWorkout.session?.currentStep;
	assert.equal(result.components.currentWorkout.feedback?.title, "Step not saved");
	assert.equal(currentStep?.rows.length, 100);
	assert.equal(currentStep?.rows[0].fields.reps.value, "0");
	assert.equal(currentStep?.rows[0].fields.loadValue.value, "27.5");
	assert.equal(currentStep?.rows[0].fields.reps.error, "Enter a valid number of reps.");

	const renderFile =
		/** @type {(filename: string, data: object) => Promise<string>} */ (ejs.renderFile);
	const html = await renderFile(path.resolve("views/index.ejs"), {
		...result,
		contentFor: () => "",
	});
	assert.match(html, /role="alert" tabindex="-1" data-workout-feedback/);
	assert.match(html, /value="27.5"/);
	assert.match(html, /aria-invalid="true"/);
	assert.match(html, /A step cannot contain more than 100 sets/);
});

test("rendered workout states expose only lifecycle-available actions", async () => {
	const renderFile =
		/** @type {(filename: string, data: object) => Promise<string>} */ (ejs.renderFile);
	const renderWorkout = (session) =>
		renderFile(path.resolve("views/partials/dashboardPage/currentWorkoutSession.ejs"), {
			currentWorkout: createWorkoutSessionViewModel({
				session,
				sessions: [session],
				daysDifference: 0,
			}),
			csrfToken: "test-token",
		});

	const plannedHtml = await renderWorkout({ ...workout, status: "planned" });
	assert.match(plannedHtml, /Ready to start/);
	assert.match(plannedHtml, />Start session</);
	assert.doesNotMatch(plannedHtml, />Complete step</);

	const resolvedSteps = workout.steps
		.concat({
			...workout.steps[0],
			id: 10,
			order: 2,
			stepLog: { ...workout.steps[0].stepLog, id: 11, status: "skipped" },
		})
		.map((step, index) => ({
			...step,
			stepLog: {
				...step.stepLog,
				status: index === 0 ? "performed" : "skipped",
			},
		}));
	const readyToFinishHtml = await renderWorkout({
		...workout,
		steps: resolvedSteps,
	});
	assert.match(readyToFinishHtml, /2 of 2 steps resolved/);
	assert.match(readyToFinishHtml, /All steps resolved/);
	assert.match(readyToFinishHtml, />Finish session</);
	assert.doesNotMatch(readyToFinishHtml, />Complete step</);

	const finishedHtml = await renderWorkout({
		...workout,
		status: "finished",
		steps: resolvedSteps,
	});
	assert.match(finishedHtml, /Workout complete/);
	assert.doesNotMatch(finishedHtml, />Finish session|>Start session|>Complete step</);

	const cancelledHtml = await renderWorkout({ ...workout, status: "cancelled" });
	assert.match(cancelledHtml, /Session cancelled/);
	assert.doesNotMatch(cancelledHtml, />Finish session|>Start session|>Complete step</);
});

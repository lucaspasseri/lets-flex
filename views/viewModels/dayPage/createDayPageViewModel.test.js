import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import ejs from "ejs";
import createDayPageViewModel from "./createDayPageViewModel.js";
import createWorkoutSessionListViewModel from "./createWorkoutSessionListViewModel.js";

const page = {
	path: "/day",
	url: "/programs/day?dayId=2",
	backUrl: "/programs",
	backUrlWithoutParams: "/programs",
	title: "Day",
};
const user = { id: 1, name: "Lucas", dateOfBirth: null, anamnesis: null };
const program = {
	id: 6,
	userId: 1,
	goalId: null,
	name: "Strength plan",
	startDate: "2026-08-20",
};
const cycle = { id: 5, programId: 6, name: "Foundation", size: 3, order: 1 };
const days = [1, 2, 3].map((id) => ({
	id,
	cycleId: 5,
	programId: 6,
	cycleOrder: 1,
	dayOrder: id,
	scheduledDate: `2026-08-${String(19 + id).padStart(2, "0")}`,
	label: `Day ${id}`,
}));
const step = {
	id: 8,
	name: "Bench",
	order: 1,
	type: "Strength",
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
};

test("day page creates predictable navigation, form, cards, and modal contracts", () => {
	const result = createDayPageViewModel({
		page,
		pageState: { userId: 1, programId: 6, cycleId: 5, dayId: 2, sessionId: 20 },
		data: {
			currentUser: user,
			program,
			cycle,
			days: { current: days[1], items: days },
			sessions: {
				items: [
					{ id: 20, name: "Available", notes: "", isArchived: false, steps: [step] },
					{ id: 21, name: "Archived", notes: "", isArchived: true, steps: [] },
				],
			},
			workoutSessions: {
				items: [
					{
						id: 30,
						trainingDayId: 2,
						sessionId: 20,
						order: 1,
						status: "planned",
						startedAt: null,
						finishedAt: null,
						notes: null,
						name: "Available",
						sessionNotes: "Notes",
						isArchived: false,
						steps: [{ ...step, stepLog: null }],
					},
					{
						id: 31,
						trainingDayId: 2,
						sessionId: 20,
						order: 2,
						status: "cancelled",
						startedAt: null,
						finishedAt: null,
						notes: null,
						name: "Cancelled",
						sessionNotes: null,
						isArchived: false,
						steps: [],
					},
				],
			},
		},
	});

	assert.equal(result.components.dayHeader.dateLabel, "21/08/2026");
	assert.equal(result.components.dayHeader.title, "Day 2");
	assert.equal(result.components.dayHeader.eyebrow, "Strength plan · Foundation");
	assert.equal(result.page.title, "Day 2 · Foundation · Let's Flex!");
	assert.equal(result.components.contextPath.programName, "Strength plan");
	assert.equal(
		result.components.contextPath.backHref,
		"/programs?programId=6&cycleId=5",
	);
	assert.equal(result.components.dayNavigation.previous?.id, 1);
	assert.equal(result.components.dayNavigation.next?.id, 3);
	assert.deepEqual(result.components.sessionLinkForm.fields.session.options, [
		{ label: "Available", value: 20 },
	]);
	assert.equal(result.components.sessionLinkForm.fields.session.value, "20");
	assert.equal(
		result.components.sessionLinkForm.createAction.href,
		"/library?createSessionForDay=2",
	);
	assert.equal(
		result.components.sessionLinkForm.actions.submit.label,
		"Assign to this day",
	);
	assert.ok(result.components.sessionLinkForm.feedback);
	assert.equal(result.components.workoutSessionList.count, 1);
	assert.equal(result.components.workoutSessionList.items[0].header.title, "Available");
	assert.equal(
		result.components.workoutSessionList.items[0].steps[0].title,
		"Barbell:",
	);
	assert.equal(result.components.workoutSessionList.items[0].steps[0].orderLabel, "01");
	assert.equal(
		result.components.workoutSessionList.items[0].steps[0].prescriptionLabel,
		"3 sets × 8 reps",
	);
	assert.equal(
		result.components.workoutSessionList.items[0].steps[0].loadLabel,
		"60 Kilograms",
	);
	assert.equal(
		result.components.workoutSessionList.cancelModals[0].form.trainingDayId,
		2,
	);
});

test("day session steps explain bodyweight and unassigned equipment loads", () => {
	const result = createWorkoutSessionListViewModel({
		currentDayId: 2,
		workoutSessions: [
			{
				id: 30,
				trainingDayId: 2,
				sessionId: 20,
				order: 1,
				status: "planned",
				startedAt: null,
				finishedAt: null,
				notes: null,
				name: "Starter",
				sessionNotes: null,
				isArchived: false,
				steps: [
					{
						...step,
						stepLog: null,
						loadValue: null,
						loadUnit: null,
						equipment: { name: "", category: "" },
					},
					{
						...step,
						stepLog: null,
						id: 9,
						loadValue: null,
						loadUnit: null,
						equipment: { name: "Dumbbell", category: "Free weight" },
					},
				],
			},
		],
	});

	assert.deepEqual(
		result.items[0].steps.map((item) => item.loadLabel),
		["No external load", "Choose a manageable dumbbell load"],
	);
});

test("day page exposes safe empty states for an invalid selection", () => {
	const result = createDayPageViewModel({
		page,
		pageState: {
			userId: null,
			programId: null,
			cycleId: null,
			dayId: 99,
			sessionId: null,
		},
		data: {
			currentUser: null,
			program: null,
			cycle: null,
			days: { current: null, items: [] },
			sessions: { items: [] },
			workoutSessions: { items: [] },
		},
	});

	assert.equal(result.pageState.dayId, null);
	assert.equal(result.components.dayNavigation.isVisible, false);
	assert.equal(result.components.contextPath.isVisible, false);
	assert.equal(result.components.sessionLinkForm.isEnabled, false);
	assert.equal(result.components.workoutSessionList.emptyState.isVisible, true);
});

test("day page offers cancellation only for planned workout sessions", () => {
	const workoutSessions = ["planned", "in_progress", "finished", "cancelled"].map(
		(status, index) => ({
			id: 30 + index,
			trainingDayId: 2,
			sessionId: 20,
			order: index + 1,
			status,
			startedAt: status === "planned" ? null : "2026-08-21T10:00:00Z",
			finishedAt: status === "finished" ? "2026-08-21T11:00:00Z" : null,
			notes: null,
			name: `${status} session`,
			sessionNotes: null,
			isArchived: false,
			steps: [],
		}),
	);

	const result = createWorkoutSessionListViewModel({
		currentDayId: 2,
		workoutSessions,
	});

	assert.deepEqual(
		result.items.map((item) => item.header.statusLabel),
		["planned", "in_progress", "finished"],
	);
	assert.equal(result.items[0].header.deleteActionLabel, "Delete planned session");
	assert.equal(result.items[0].header.modalId, "deleteWorkoutSessionId-30");
	assert.equal(result.items[1].header.deleteActionLabel, undefined);
	assert.equal(result.items[1].header.modalId, undefined);
	assert.equal(result.items[2].header.deleteActionLabel, undefined);
	assert.equal(result.items[2].header.modalId, undefined);
	assert.deepEqual(
		result.cancelModals.map((modal) => modal.id),
		["deleteWorkoutSessionId-30"],
	);
});

test("day template renders only from its component ViewModels", async () => {
	const viewModel = createDayPageViewModel({
		page,
		pageState: {
			userId: 1,
			programId: 6,
			cycleId: 5,
			dayId: 2,
			sessionId: null,
		},
		data: {
			currentUser: user,
			program,
			cycle,
			days: { current: days[1], items: days },
			sessions: {
				items: [
					{ id: 20, name: "Available", notes: "", isArchived: false, steps: [step] },
				],
			},
			workoutSessions: {
				items: [
					{
						id: 30,
						trainingDayId: 2,
						sessionId: 20,
						order: 1,
						status: "planned",
						startedAt: null,
						finishedAt: null,
						notes: null,
						name: "Available",
						sessionNotes: "Notes",
						isArchived: false,
						steps: [{ ...step, stepLog: null }],
					},
					{
						id: 31,
						trainingDayId: 2,
						sessionId: 20,
						order: 2,
						status: "finished",
						startedAt: "2026-08-21T10:00:00Z",
						finishedAt: "2026-08-21T11:00:00Z",
						notes: null,
						name: "Finished session",
						sessionNotes: null,
						isArchived: false,
						steps: [],
					},
				],
			},
		},
		workoutFeedback: {
			tone: "error",
			title: "Workout not removed",
			message: "This workout session can no longer be cancelled.",
		},
	});
	const renderFile =
		/** @type {(filename: string, data: object) => Promise<string>} */ (ejs.renderFile);
	const emptyViewModel = createDayPageViewModel({
		page,
		pageState: {
			userId: null,
			programId: null,
			cycleId: null,
			dayId: null,
			sessionId: null,
		},
		data: {
			currentUser: null,
			program: null,
			cycle: null,
			days: { current: null, items: [] },
			sessions: { items: [] },
			workoutSessions: { items: [] },
		},
	});
	const [html, emptyHtml] = await Promise.all(
		[viewModel, emptyViewModel].map((model) =>
			renderFile(path.resolve("views/day.ejs"), { ...model, contentFor: () => "" }),
		),
	);

	assert.match(html, /data-day-page data-workout-tracker/);
	assert.match(html, /role="alert" tabindex="-1" data-workout-feedback/);
	assert.match(html, /Workout not removed/);
	assert.match(html, /This workout session can no longer be cancelled/);
	assert.match(html, /Program hierarchy/);
	assert.match(html, /Strength plan · Foundation/);
	assert.match(html, /Strength plan[\s\S]*Foundation[\s\S]*Day 2/);
	assert.match(html, /21\/08\/2026/);
	assert.match(html, /href="\/programs\/day\?dayId=1"/);
	assert.match(html, /day-navigation__item--current[^>]*aria-current="date"/);
	assert.match(html, /<option[\s\S]*?value="20"[\s\S]*?>\s*Available/);
	assert.match(html, /workout-card--workout/);
	assert.match(html, /Barbell:/);
	assert.match(html, /action="\/workout_sessions\/30\?_method=PATCH"/);
	assert.doesNotMatch(html, /deleteWorkoutSessionId-31/);
	assert.match(html, /name="trainingDayId" value="2"/);
	assert.match(html, /Assign to this day/);
	assert.match(html, /href="\/library\?createSessionForDay=2"/);
	assert.match(html, /Sessions assigned to this day/);
	assert.match(html, /data-modal/);
	assert.match(html, /shared-button--danger/);
	assert.match(html, /src="\/js\/pages\/day\/index.js"/);
	assert.doesNotMatch(html, /training_day_id|scheduled_date|session_notes/);
	assert.match(emptyHtml, /Training day unavailable/);
	assert.match(emptyHtml, /No session assigned yet/);
	assert.match(emptyHtml, /<select[^>]*disabled/);
	assert.doesNotMatch(emptyHtml, /workout-card--workout/);
});

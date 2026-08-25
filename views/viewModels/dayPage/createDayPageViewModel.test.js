import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import ejs from "ejs";
import createDayPageViewModel from "./createDayPageViewModel.js";

const page = {
	path: "/day",
	url: "/programs/day?dayId=2",
	backUrl: "/programs",
	backUrlWithoutParams: "/programs",
	title: "Day",
};
const user = { id: 1, name: "Lucas", dateOfBirth: null, anamnesis: null };
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
		pageState: { userId: 1, programId: 6, dayId: 2 },
		data: {
			currentUser: user,
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
	assert.equal(result.components.dayNavigation.previous?.id, 1);
	assert.equal(result.components.dayNavigation.next?.id, 3);
	assert.deepEqual(result.components.sessionLinkForm.fields.session.options, [
		{ label: "Available", value: 20 },
	]);
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
		result.components.workoutSessionList.cancelModals[0].form.trainingDayId,
		2,
	);
});

test("day page exposes safe empty states for an invalid selection", () => {
	const result = createDayPageViewModel({
		page,
		pageState: { userId: null, programId: null, dayId: 99 },
		data: {
			currentUser: null,
			days: { current: null, items: [] },
			sessions: { items: [] },
			workoutSessions: { items: [] },
		},
	});

	assert.equal(result.pageState.dayId, null);
	assert.equal(result.components.dayNavigation.isVisible, false);
	assert.equal(result.components.sessionLinkForm.isEnabled, false);
	assert.equal(result.components.workoutSessionList.emptyState.isVisible, true);
});

test("day template renders only from its component ViewModels", async () => {
	const viewModel = createDayPageViewModel({
		page,
		pageState: { userId: 1, programId: 6, dayId: 2 },
		data: {
			currentUser: user,
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
				],
			},
		},
	});
	const renderFile =
		/** @type {(filename: string, data: object) => Promise<string>} */ (ejs.renderFile);
	const emptyViewModel = createDayPageViewModel({
		page,
		pageState: { userId: null, programId: null, dayId: null },
		data: {
			currentUser: null,
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

	assert.match(html, /data-day-page/);
	assert.match(html, /21\/08\/2026/);
	assert.match(html, /href="\/programs\/day\?dayId=1"/);
	assert.match(html, /day-navigation__item--current[^>]*aria-current="date"/);
	assert.match(html, /<option[\s\S]*?value="20"[\s\S]*?>\s*Available/);
	assert.match(html, /workout-card--workout/);
	assert.match(html, /Barbell:/);
	assert.match(html, /action="\/workout_sessions\/30\?_method=PATCH"/);
	assert.match(html, /name="trainingDayId" value="2"/);
	assert.match(html, /data-modal/);
	assert.match(html, /shared-button--danger/);
	assert.match(html, /src="\/js\/pages\/day\/index.js"/);
	assert.doesNotMatch(html, /training_day_id|scheduled_date|session_notes/);
	assert.match(emptyHtml, /Date outside the program&#39;s boundaries/);
	assert.match(emptyHtml, /The current day does not yet have any training sessions/);
	assert.match(emptyHtml, /<select[^>]*disabled/);
	assert.doesNotMatch(emptyHtml, /workout-card--workout/);
});

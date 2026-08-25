import test from "node:test";
import assert from "node:assert/strict";
import createSessionStatusMarkersViewModel from "./createSessionStatusMarkersViewModel.js";

test("maps every persisted workout-session status to shared marker presentation", () => {
	const result = createSessionStatusMarkersViewModel([
		{ id: 1, status: "planned" },
		{ id: 2, status: "in_progress" },
		{ id: 3, status: "finished" },
		{ id: 4, status: "cancelled" },
	]);

	assert.deepEqual(
		result.items.map(({ label, className }) => ({ label, className })),
		[
			{
				label: "Planned",
				className: "session-status-marker session-status-marker--planned",
			},
			{
				label: "In progress",
				className: "session-status-marker session-status-marker--in-progress",
			},
			{
				label: "Finished",
				className: "session-status-marker session-status-marker--finished",
			},
			{
				label: "Cancelled",
				className: "session-status-marker session-status-marker--cancelled",
			},
		],
	);
	assert.equal(
		result.accessibleLabel,
		"4 workout sessions: Planned, In progress, Finished, Cancelled",
	);
});

test("handles unknown statuses and days without sessions predictably", () => {
	const unknown = createSessionStatusMarkersViewModel([
		{ id: 1, status: "future_status" },
	]);
	assert.equal(unknown.items[0].label, "Status unknown");
	assert.match(unknown.items[0].className, /--unknown$/);

	const empty = createSessionStatusMarkersViewModel([]);
	assert.deepEqual(empty.items, []);
	assert.equal(empty.accessibleLabel, "No workout sessions planned");
});

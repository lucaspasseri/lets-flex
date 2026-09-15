import assert from "node:assert/strict";
import test from "node:test";

import { collectMediaCandidates } from "./loadMediaAssignments.js";

test("Library media candidates include each exercise muscle without N+1 lookups", () => {
	const candidates = collectMediaCandidates({
		exerciseTemplates: [
			{
				id: 9,
				variant: { id: 11 },
				movementPattern: { id: 3 },
				muscles: [{ id: 21 }, { id: 22 }, { id: 21 }],
			},
		],
		sessions: [
			{
				steps: [{ exerciseId: 9, exerciseVariantId: 11, movementPatternId: 3 }],
			},
		],
	});

	assert.deepEqual(candidates, [
		{ entityType: "exercise", entityId: 9 },
		{ entityType: "exercise_variant", entityId: 11 },
		{ entityType: "movement_pattern", entityId: 3 },
		{ entityType: "muscle", entityId: 21 },
		{ entityType: "muscle", entityId: 22 },
	]);
});

test("invalid or absent muscle IDs are ignored by the shared candidate collector", () => {
	assert.deepEqual(
		collectMediaCandidates({
			exerciseTemplates: [{ id: 1, muscles: [{ id: 0 }, { id: "2" }, { id: null }] }],
		}),
		[{ entityType: "exercise", entityId: 1 }],
	);
});

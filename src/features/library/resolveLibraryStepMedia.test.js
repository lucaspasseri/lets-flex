import assert from "node:assert/strict";
import test from "node:test";

import resolveLibraryStepMedia from "./resolveLibraryStepMedia.js";

function step(type, name = "Unlisted movement") {
	return /** @type {any} */ ({
		type,
		movementPattern: "Gait",
		exercise: {
			name,
			variantName: `Bodyweight ${name}`,
			environment: "gym_or_home",
		},
	});
}

test("Library step media preserves exact exercise variant resolution", () => {
	const media = resolveLibraryStepMedia(step("Exercise", "Bench Press"));

	assert.equal(media.src, null);
	assert.equal(media.presentation, "initial");
	assert.equal(media.initial, "B");
	assert.equal(media.entityType, "exercise");
	assert.equal(media.isFallback, true);
});

test("Library step type supplies category fallback context", () => {
	assert.equal(resolveLibraryStepMedia(step("Cardio")).initial, "B");
	assert.equal(resolveLibraryStepMedia(step("Warm-up")).initial, "B");
	assert.equal(resolveLibraryStepMedia(step("Cooldown")).initial, "B");
	assert.equal(resolveLibraryStepMedia(step("Cardio")).src, null);
});

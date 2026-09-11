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

	assert.equal(media.src, "/media/exercise-bench-press.svg");
	assert.equal(media.entityType, "exercise");
	assert.equal(media.isFallback, true);
});

test("Library step type supplies category fallback context", () => {
	assert.equal(
		resolveLibraryStepMedia(step("Cardio")).src,
		"/media/category-cardio.svg",
	);
	assert.equal(
		resolveLibraryStepMedia(step("Warm-up")).src,
		"/media/category-warm-up.svg",
	);
	assert.equal(
		resolveLibraryStepMedia(step("Cooldown")).src,
		"/media/category-cooldown.svg",
	);
});

import assert from "node:assert/strict";
import test from "node:test";

import resolveStepMedia from "./resolveStepMedia.js";

test("step media passes stable entity identities through the shared resolver", () => {
	const requests = [];
	const resolved = {
		src: "/media/assigned.svg",
		alt: "Assigned exercise image",
		width: 640,
		height: 480,
		aspectRatio: 4 / 3,
		matchType: "exercise_variant",
		mediaType: "image",
		fallbackType: "none",
		presentation: "image",
		initial: null,
		entityType: "exercise_variant",
		matchedKey: null,
		matchedId: 11,
		isFallback: false,
	};
	const step = /** @type {any} */ ({
		exerciseVariantId: 11,
		exerciseId: 7,
		movementPatternId: 3,
		movementPattern: "Push",
		canonicalMovementPattern: "push",
		type: "Exercise",
		exercise: {
			name: "Bench Press",
			canonicalName: "Bench Press",
			variantName: "Barbell Bench Press",
			canonicalVariantName: "Barbell Bench Press",
			environment: "gym",
		},
	});

	const media = resolveStepMedia(step, {
		resolveMedia(request) {
			requests.push(request);
			return resolved;
		},
	});

	assert.equal(media, resolved);
	assert.deepEqual(requests[0], {
		entityType: "exercise_variant",
		entityId: 11,
		parentExerciseId: 7,
		movementPatternId: 3,
		variantName: "Barbell Bench Press",
		baseName: "Bench Press",
		movementPattern: "Push",
		matchVariantName: "Barbell Bench Press",
		matchBaseName: "Bench Press",
		matchMovementPattern: "push",
		environment: "gym",
		category: "strength",
		label: "Barbell Bench Press",
		presentation: "image",
	});
});

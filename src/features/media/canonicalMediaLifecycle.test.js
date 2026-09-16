import assert from "node:assert/strict";
import test from "node:test";

import createMediaResolver from "./createMediaResolver.js";
import resolveStepMedia from "./resolveStepMedia.js";

const step = /** @type {any} */ ({
	exerciseVariantId: 11,
	exerciseId: 9,
	movementPatternId: 20,
	type: "exercise",
	movementPattern: "Push",
	canonicalMovementPattern: "push",
	exercise: {
		name: "Push-up",
		canonicalName: "push-up",
		variantName: "Bodyweight Push-up",
		canonicalVariantName: "bodyweight-push-up",
		environment: null,
	},
});

function assignment(entityType, entityId, storageKey) {
	return {
		entity_type: entityType,
		entity_id: entityId,
		media_asset_id: storageKey.endsWith("-a.png") ? 101 : 102,
		storage_key: storageKey,
		mime_type: "image/png",
		width: 960,
		height: 640,
		alt_text: storageKey,
	};
}

test("an unchanged session step follows a changed base canonical assignment on the next render", () => {
	const resolveBeforePromotion = createMediaResolver([
		assignment("exercise", 9, "assets/push-up-a.png"),
	]);
	const mediaBeforePromotion = resolveStepMedia(step, {
		resolveMedia: resolveBeforePromotion,
	});

	const resolveAfterPromotion = createMediaResolver([
		assignment("exercise", 9, "assets/push-up-b.png"),
	]);
	const mediaAfterPromotion = resolveStepMedia(step, {
		resolveMedia: resolveAfterPromotion,
	});

	assert.equal(mediaBeforePromotion.src, "assets/push-up-a.png");
	assert.equal(mediaAfterPromotion.src, "assets/push-up-b.png");
	assert.equal(mediaBeforePromotion.matchType, "exercise");
	assert.equal(mediaAfterPromotion.matchType, "exercise");
	assert.equal("media" in step, false);
});

test("a direct variant assignment remains ahead of a changed base assignment", () => {
	const resolveMedia = createMediaResolver([
		assignment("exercise_variant", 11, "assets/push-up-variant.png"),
		assignment("exercise", 9, "assets/push-up-b.png"),
	]);

	const media = resolveStepMedia(step, { resolveMedia });

	assert.equal(media.src, "assets/push-up-variant.png");
	assert.equal(media.matchType, "exercise_variant");
	assert.equal(media.matchedId, 11);
});

const exerciseStep = (name, variantCatalogKey, sets, reps) =>
	Object.freeze({ name, variantCatalogKey, sets, reps });

/**
 * The one authoritative starter-training definition. Consumers provision an
 * owner-specific copy from the global session template seeded from this data.
 */
export const starterWorkoutManifest = Object.freeze({
	goalName: "general_fitness",
	programName: "Guest Starter Program",
	cycleName: "Getting Started",
	cycleSize: 1,
	trainingDayLabel: "Full Body",
	sessionName: "Sample Full Body Session",
	sessionNotes: "A short, read-only full-body session for learning the workout flow.",
	provisioningKey: "starter-training-v1",
	steps: Object.freeze([
		exerciseStep("Box squats", "bodyweight-box-squat", 3, 10),
		exerciseStep("Push ups", "bodyweight-push-up", 3, 10),
		exerciseStep("One-arm rows", "one-arm-dumbbell-row", 3, 10),
		exerciseStep("Glute bridges", "bodyweight-glute-bridge", 3, 12),
	]),
});

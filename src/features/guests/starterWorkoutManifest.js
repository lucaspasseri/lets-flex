const exerciseStep = (name, variantName, sets, reps) =>
	Object.freeze({ name, variantName, sets, reps });

export const starterWorkoutManifest = Object.freeze({
	goalName: "general_fitness",
	programName: "Guest Starter Program",
	cycleName: "Getting Started",
	cycleSize: 1,
	trainingDayLabel: "Full Body",
	sessionName: "Sample Full Body Session",
	sessionNotes: "A short, read-only full-body session for learning the workout flow.",
	steps: Object.freeze([
		exerciseStep("Box squats", "Bodyweight Box Squat", 3, 10),
		exerciseStep("Push ups", "Bodyweight Push Up", 3, 10),
		exerciseStep("One-arm rows", "One-Arm Dumbbell Row", 3, 10),
		exerciseStep("Glute bridges", "Bodyweight Glute Bridge", 3, 12),
	]),
});

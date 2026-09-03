import { initializeWorkoutTracker } from "./workoutTracker.js";

export function initialize(root = document) {
	root.querySelectorAll("[data-workout-tracker]").forEach(initializeWorkoutTracker);
}

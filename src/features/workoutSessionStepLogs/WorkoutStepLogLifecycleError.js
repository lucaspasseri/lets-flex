export default class WorkoutStepLogLifecycleError extends Error {
	/** @param {"perform" | "skip"} action */
	constructor(action) {
		super(`Workout step ${action} is unavailable`);
		this.name = "WorkoutStepLogLifecycleError";
		this.action = action;
	}
}

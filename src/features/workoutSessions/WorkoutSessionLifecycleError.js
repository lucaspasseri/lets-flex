export default class WorkoutSessionLifecycleError extends Error {
	/**
	 * @param {"start" | "finish" | "cancel"} action
	 * @param {"unavailable" | "unresolved_steps" | "active_session"} [reason]
	 */
	constructor(action, reason = "unavailable") {
		super(`Workout session ${action} is unavailable`);
		this.name = "WorkoutSessionLifecycleError";
		this.action = action;
		this.reason = reason;
	}
}

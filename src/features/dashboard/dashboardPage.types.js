/**
 * @typedef {object} DashboardPageData
 * @property {import("../users/users.types.js").User | null} currentUser
 * @property {import("../programs/programs.types.js").Program | null} currentProgram
 * @property {Date} selectedDate
 * @property {import("../trainingDays/trainingDays.types.js").TrainingDay | null} currentTrainingDay
 * @property {import("../cycles/cycles.types.js").Cycle | null} currentCycle
 * @property {import("../cycles/cycles.types.js").Cycle[]} cycles
 * @property {import("../workoutSessions/workoutSessions.types.js").WorkoutSession[]} workoutSessions
 * @property {import("../workoutSessions/workoutSessions.types.js").WorkoutSession[]} currentDayWorkoutSessions
 * @property {import("../workoutSessions/workoutSessions.types.js").WorkoutSession | null} selectedWorkoutSession
 * @property {Array<{cycleId: number, cycleName: string, days: Array<{date: Date, dateLabel: string, offset: number | null, intensity: "none" | "one" | "many"}>}>} heatmap
 * @property {Array<{date: Date, label: string, scheduledCount: number, finishedCount: number}>} barChart
 */

/**
 * @typedef {object} GetDashboardPageDataInput
 * @property {number | null} userId
 * @property {number | null} programId
 * @property {number | null} daysDifference
 * @property {number | null} workoutSessionId
 * @property {Date} [now]
 */
export {};

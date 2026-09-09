/**
 * @typedef {object} DashboardPageData
 * @property {import("../users/users.types.js").User | null} currentUser
 * @property {import("../programs/programs.types.js").Program | null} currentProgram
 * @property {Date} selectedDate
 * @property {import("../trainingDays/trainingDays.types.js").TrainingDay | null} currentTrainingDay
 * @property {import("../cycles/cycles.types.js").Cycle | null} currentCycle
 * @property {import("../cycles/cycles.types.js").Cycle[]} cycles
 * @property {Array<{id: number, status: string, scheduledDate?: string | Date | null}>} scheduledWorkoutSessions
 * @property {import("../workoutSessions/workoutSessions.types.js").WorkoutSession[]} currentDayWorkoutSessions
 * @property {import("../workoutSessions/workoutSessions.types.js").WorkoutSession | null} selectedWorkoutSession
 * @property {import("../programAnalytics/programAnalytics.types.js").ProgramAnalytics} analytics
 * @property {Array<{cycleId: number, cycleName: string, days: Array<{date: Date, dateKey: string, dateLabel: string, offset: number | null, intensity: "none" | "one" | "many", finishedCount: number}>}>} heatmap
 * @property {Array<{date: Date, label: string, scheduledCount: number, finishedCount: number, cancelledCount: number, completionRate: number | null}>} barChart
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

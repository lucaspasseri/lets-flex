/**
 * @typedef {import("../users/users.types.js").User} User
 * @typedef {import("../programs/programs.types.js").ProgramRow} ProgramRow
 * @typedef {import("../trainingDays/trainingDays.types.js").TrainingDayRow} TrainingDayRow
 * @typedef {import("../trainingDays/trainingDays.types.js").TrainingDay} TrainingDay
 * @typedef {import("../sessions/sessions.types.js").SessionMapper} Session
 * @typedef {import("../workoutSessions/workoutSessions.types.js").WorkoutSession} WorkoutSession
 */

/**
 * @typedef {object} LocalsPage
 * @property {string} path
 * @property {string} url
 * @property {string} backUrl
 * @property {string} backUrlWithoutParams
 * @property {string} title
 */

/**
 * @typedef {object} PageState
 * @property {User["id"] | null} userId
 * @property {ProgramRow["id"] | null} programId
 * @property {import("../cycles/cycles.types.js").CycleRow["id"] | null} cycleId
 * @property {TrainingDayRow["id"] | null} dayId
 * @property {import("../sessions/sessions.types.js").SessionRow["id"] | null} sessionId
 */

/**
 * @typedef {object} GetDayPageDataInput
 * @property {User["id"] | null} userId
 * @property {TrainingDayRow["id"] | null} dayId
 */

/**
 * @typedef {object} DayPageData
 * @property {User | null} currentUser
 * @property {import("../programs/programs.types.js").Program | null} program
 * @property {import("../cycles/cycles.types.js").Cycle | null} cycle
 * @property {{current: TrainingDay | null, items: TrainingDay[]}} days
 * @property {{items: Session[]}} sessions
 * @property {{items: WorkoutSession[]}} workoutSessions
 */

/**
 * @typedef { object} CreateDayPageViewModelInput
 * @property {LocalsPage} page
 * @property {PageState} pageState
 * @property {DayPageData} data
 * @property {Record<string, any>} [sessionLinkFormState]
 */

/**
 * @typedef { object} DayPageViewModel
 * @property {LocalsPage} page
 * @property {PageState} pageState
 * @property {{currentUser: User | null, activeNavigation: "programs"}} shell
 * @property {*} components
 */

export {};

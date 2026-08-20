/**
 * @typedef {import("../users/users.types.js").UserRow} UserRow
 * @typedef {import("../users/users.types.js").User} User
 * @typedef {import("../programs/programs.types.js").ProgramRow} ProgramRow
 * @typedef {import("../trainingDays/trainingDays.types.js").TrainingDayRow} TrainingDayRow
 * @typedef {import("../sessions/sessions.types.js").SessionRow} SessionRow
 * @typedef {import("../workoutSessions/workoutSessions.types.js").WorkoutSessionRow} WorkoutSessionRow
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
 * @property {UserRow["id"] | null} userId
 * @property {ProgramRow["id"] | null} programId
 * @property {TrainingDayRow["id"] | null} dayId
 */

/**
 * @typedef {object} GetDayPageDataInput
 * @property {UserRow["id"] | null} userId
 * @property {ProgramRow["id"] | null} programId
 * @property {TrainingDayRow["id"] | null} dayId
 */

/**
 * @typedef {object} DayPageData
 * @property {{current: UserRow | null }} users
 * @property {{current: TrainingDayRow | null, items: TrainingDayRow[]}} days
 * @property {{items: SessionRow[]}} sessions
 * @property {{items: WorkoutSessionRow[]}} workoutSessions
 */

/**
 * @typedef { object} CreateDayPageViewModelInput
 * @property {LocalsPage} page
 * @property {PageState} pageState
 * @property {DayPageData} data
 */

/**
 * @typedef { object} DayPageViewModel
 * @property {LocalsPage} page
 * @property {PageState} pageState
 * @property {{currentUser: UserRow | null}} shell
 * @property {*} components
 */

export {};

/**
 * @typedef {import("../users/users.types.js").User} User
 * @typedef {import("./programs.types.js").Program} Program
 * @typedef {import("../cycles/cycles.types.js").Cycle} Cycle
 * @typedef {import("../trainingDays/trainingDays.types.js").TrainingDay} TrainingDay
 * @typedef {import("../goals/goals.types.js").Goal} Goal
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
 * @property {Program["id"] | null} programId
 * @property {Cycle["id"] | null} cycleId
 */

/**
 * @typedef {object} GetProgramsPageDataInput
 * @property {User["id"] | null} userId
 * @property {Program["id"] | null} programId
 * @property {Cycle["id"] | null} cycleId
 */

/**
 * Data available to the Programs page presentation layer.
 *
 * @typedef {object} ProgramsPageData
 * @property {User | null} currentUser
 * @property {{ current: Program | null, items: Program[] }} programs
 * @property {{ current: Cycle | null, items: Cycle[] }} cycles
 * @property {TrainingDay[]} trainingDays
 * @property {Goal[]} goals
 */

/**
 * @typedef { object} CreateProgramsPageViewModelInput
 * @property {LocalsPage} page
 * @property {PageState} pageState
 * @property {ProgramsPageData} data
 * @property {Record<string, any>} [programFormState]
 * @property {Record<string, any>} [cycleFormState]
 */

export {};

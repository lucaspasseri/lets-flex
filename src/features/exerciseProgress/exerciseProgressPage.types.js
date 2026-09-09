/**
 * @typedef {object} ExerciseProgressPageQuery
 * @property {number | null} programId
 * @property {string | null} exerciseKey
 * @property {string | null} fromDate
 * @property {string | null} toDate
 * @property {number} pointLimit
 */

/**
 * @typedef {object} ExerciseProgressPageData
 * @property {import("../users/users.types.js").User | null} currentUser
 * @property {import("../programs/programs.types.js").Program[]} programs
 * @property {import("./exerciseProgress.types.js").ExerciseProgressChoice[]} choices
 * @property {import("./exerciseProgress.types.js").ExerciseProgress | null} progress
 */

export {};

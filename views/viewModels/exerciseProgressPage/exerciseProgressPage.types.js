/** @typedef {{value: string | number, label: string, disabled?: boolean}} SelectOption */

/**
 * @typedef {object} ExerciseProgressPageState
 * @property {string} kind
 * @property {string} title
 * @property {string} message
 * @property {{label: string, href: string} | null} action
 */

/**
 * @typedef {object} ExerciseProgressPageViewModel
 * @property {Record<string, unknown>} page
 * @property {{currentUser: import("../../../src/features/users/users.types.js").User, activeNavigation: "progress"}} shell
 * @property {{eyebrow: string, title: string, description: string, meta: string | null}} heading
 * @property {{action: string, value: number | null, options: SelectOption[]}} programFilter
 * @property {{isVisible: boolean, action: string, programId: number | null, exerciseKey: string | null, exerciseOptions: SelectOption[], fromDate: string | null, toDate: string | null, pointLimit: number, pointLimitOptions: SelectOption[], hasDateFilters: boolean, clearDatesHref: string | null}} analysisFilter
 * @property {{isVisible: boolean, selection: {title: string, exerciseName: string, exerciseVariantName: string | null, availableContext: string}, metrics: Array<{label: string, value: string}>, coverage: string[], units: Array<{unit: string, maximumLoad: string, volume: string, loadContext: string, volumeContext: string}>, occurrences: Array<{workoutSessionId: number, historyHref: string, date: {value: string, label: string}, finishedAt: string, sessionName: string, performedStepCount: number, recordedSetCount: number, completedRepetitionCount: number, units: Array<{unit: string, maximumLoad: string, volume: string, context: string}>, emptyUnitMessage: string | null}>, truncationMessage: string | null}} results
 * @property {ExerciseProgressPageState | null} state
 */

/**
 * @typedef {object} ExerciseProgressStatePageViewModel
 * @property {Record<string, unknown>} page
 * @property {{currentUser: import("../../../src/features/users/users.types.js").User | null, activeNavigation: "progress"}} shell
 * @property {{kind: "not-found" | "failure", eyebrow: string, title: string, message: string, actionLabel: string, actionHref: string}} state
 */

export {};

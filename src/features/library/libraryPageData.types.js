/**
 * @typedef {import("../users/users.types.js").User} User
 * @typedef {import("../sessions/sessions.types.js").SessionMapper} Session
 * @typedef {import("../equipments/equipments.types.js").EquipmentMapper} Equipment
 * @typedef {import("../movementPatterns/movementPatterns.types.js").MovementPatternMapper} MovementPattern
 * @typedef {import("../muscles/muscles.types.js").MuscleMapper} Muscle
 * @typedef {import("../muscleRoles/muscleRoles.types.js").MuscleRoleMapper} MuscleRole
 * @typedef {import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMapper} ExerciseTemplate
 * @typedef {import("../stepTypes/stepTypes.types.js").StepTypeViewModel} StepType
 */

/**
 * Application data required to present the library page.
 * It contains no labels, modal identifiers, form fields, or other UI decisions.
 *
 * @typedef {object} LibraryPageData
 * @property {User | null} user
 * @property {Session | null} activeSession
 * @property {Session[]} sessions
 * @property {Equipment[]} equipments
 * @property {MovementPattern[]} movementPatterns
 * @property {Muscle[]} muscles
 * @property {MuscleRole[]} muscleRoles
 * @property {ExerciseTemplate[]} exerciseTemplates
 * @property {StepType[]} stepTypes
 */

export {};

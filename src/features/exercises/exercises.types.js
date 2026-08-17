/**
 * @typedef {import("../movementPatterns/movementPatterns.types.js").MovementPatternRow} MovementPatternRow
 */

/**
 * @typedef {object} ExerciseRow
 * @property {number} id
 * @property {string} name
 * @property {MovementPatternRow["id"]} movement_pattern_id
 */

/**
 * @typedef {object} CreateExerciseInput
 * @property {string} name
 * @property {MovementPatternRow["id"]} movementPatternId
 */

/**
 * @typedef {object} DeleteExerciseInput
 * @property {ExerciseRow["id"]} exerciseId
 */

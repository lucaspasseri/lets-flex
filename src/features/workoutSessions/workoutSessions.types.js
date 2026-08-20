/**
 * @typedef {import("../muscles/muscles.types.js").MuscleRow} MuscleRow
 */

/**
 * @typedef {object} StepLogRow
 * @property {number} id
 * @property {string} name
 * @property {string} notes
 * @property {string} status
 * @property {string} started_at
 * @property {number} step_order
 * @property {string} completed_at
 * @property {number} planned_sets
 * @property {number} planned_reps
 * @property {number} step_type_id
 * @property {number} session_step_id
 * @property {number} planned_load_value
 * @property {string} planned_load_unit
 * @property {number} workout_session_id
 * @property {number} exercise_variant_id
 */

/**
 * @typedef {object} WorkoutSessionStepRow
 * @property {number} id
 * @property {string} name
 * @property {number} sets
 * @property {number} reps
 * @property {number} load_value
 * @property {string} load_unit
 * @property {number} step_order
 * @property {string} step_type_name
 * @property {string} exercise_variant_name
 * @property {string} exercise_name
 * @property {string} movement_pattern_name
 * @property {string} equipment_name
 * @property {string} equipment_category
 * @property {StepLogRow} step_log
 * @property {MuscleRow[]} muscles
 */

/**
 * @typedef {object} WorkoutSessionRow
 * @property {number} id
 * @property {number} training_day_id
 * @property {number} session_id
 * @property {number} workout_session_order
 * @property {string} status
 * @property {string} started_at
 * @property {string} finished_at
 * @property {string} notes
 * @property {string} name
 * @property {boolean} is_archived
 * @property {string} session_notes
 * @property {WorkoutSessionStepRow} steps
 */

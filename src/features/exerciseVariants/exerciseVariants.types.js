/**
 * @typedef {import("../exercises/exercises.types.js").ExerciseRow} ExerciseRow
 * @typedef {import("../equipments/equipments.types.js").EquipmentRow} EquipmentRow
 */

/**
 * @typedef {object} ExerciseVariantRow
 * @property {number} id
 * @property {ExerciseRow["id"]} exercise_id
 * @property {EquipmentRow["id"]} equipment_id
 * @property {string} name
 * @property {string} setup_description
 * @property {string} environment
 * @property {string} notes
 */

/**
 * @typedef {object} CreateExerciseVariantInput
 * @property {string} name
 * @property {ExerciseRow["id"]} exerciseId
 * @property {EquipmentRow["id"]} equipmentId
 */

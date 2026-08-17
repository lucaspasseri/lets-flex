/**
 * @typedef {import("../muscleRoles/muscleRoles.types.js").MuscleRoleMapper} MuscleRoleMapper
 * @typedef {import("../movementPatterns/movementPatterns.types.js").MovementPatternMapper} MovementPatternMapper
 * @typedef {import("../equipments/equipments.types.js").EquipmentMapper} EquipmentMapper
 * @typedef {import("../exerciseVariants/exerciseVariants.types.js").ExerciseVariantRow} ExerciseVariantRow
 */

/**
 * @typedef {object} ExerciseTemplateMuscleMapper
 * @property {number} id
 * @property {string} commonName
 * @property {string} scientificName
 * @property {string} bodyRegion
 * @property {string} referenceUrl
 * @property {MuscleRoleMapper} role
 */

/**
 * @typedef {object} ExerciseTemplateExerciseVariantMapper
 * @property {ExerciseVariantRow["id"]} id
 * @property {string} name
 * @property {string} setupDescription
 * @property {string} environment
 * @property {string} notes
 */

/**
 * SQL raw data of aggregated exercise query.
 *
 * @typedef {object} ExerciseTemplateRow
 * @property {number} id
 * @property {string} name
 * @property {number} movement_pattern_id
 * @property {string} movement_pattern_name
 * @property {string} movement_pattern_notes
 * @property {number} equipment_id
 * @property {string} equipment_name
 * @property {string} equipment_category
 * @property {number} exercise_variant_id
 * @property {string} exercise_variant_name
 * @property {string} exercise_variant_setup_description
 * @property {string} exercise_variant_environment
 * @property {string} exercise_variant_notes
 * @property {ExerciseTemplateMuscleMapper[]} muscles
 */

/**
 * Exercise Template Mapper
 *
 * @typedef {object} ExerciseTemplateMapper
 * @property {ExerciseTemplateRow["id"]} id
 * @property {string} name
 * @property {MovementPatternMapper} movementPattern
 * @property {EquipmentMapper} equipment
 * @property {ExerciseTemplateExerciseVariantMapper} variant
 * @property {ExerciseTemplateMuscleMapper[]} muscles
 */

/**
 * @typedef {object} ExerciseTemplateMuscleItemViewModel
 * @property {number} id
 * @property {string} name
 */

/**
 * @typedef {object} ExerciseTemplateMusclesViewModel
 * @property {ExerciseTemplateMuscleItemViewModel} [primary]
 * @property {ExerciseTemplateMuscleItemViewModel} [secondary]
 */

/**
 * @typedef {object} ExerciseTemplateItemSummary
 * @property {string} movementPatternLabel
 * @property {string} equipmentSummary
 */

/**
 * @typedef {object} ExerciseTemplateMovementItemPattern
 * @property {string} name
 */

/**
 * @typedef {object} ExerciseTemplateItemVariant
 * @property {ExerciseVariantRow["id"]} id
 * @property {string} name
 * @property {EquipmentMapper} equipment
 * @property {string} environmentLabel
 * @property {string} setupDescription
 * @property {string} notes
 */

/**
 * @typedef {object} ExerciseTemplateItemDetails
 * @property {string} description
 * @property {ExerciseTemplateMovementItemPattern} movementPattern
 * @property {ExerciseTemplateMusclesViewModel} muscleTemplates
 * @property {ExerciseTemplateItemVariant} variant
 */

/**
 * @typedef {object} ExerciseTemplateItemActions
 * @property {*} remove
 */

/**
 * @typedef {object} ExerciseTemplateItemViewModel
 * @property {ExerciseTemplateRow["id"]} id
 * @property {string} name
 * @property {string} searchKeyWord
 * @property {ExerciseTemplateItemSummary} summary
 * @property {ExerciseTemplateItemDetails} details
 * @property {ExerciseTemplateItemActions} actions
 */

/**
 * @typedef {object} ExerciseTemplateActions
 * @property {*} create
 */

/**
 * @typedef {object} ExerciseTemplatesViewModel
 * @property {string} id
 * @property {string} label
 * @property {string} description
 * @property {number} count
 * @property {string} countLabel
 * @property {{title: string, description: string, icon: string}} emptyState
 * @property {ExerciseTemplateMuscleItemViewModel[]} items
 * @property {ExerciseTemplateActions} actions
 */

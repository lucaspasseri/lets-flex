/**
 * @typedef {import("../muscleRoles/muscleRoles.types.js").MuscleRoleMapper} MuscleRoleMapper
 * @typedef {import("../movementPatterns/movementPatterns.types.js").MovementPatternMapper} MovementPatternMapper
 * @typedef {import("../equipments/equipments.types.js").EquipmentMapper} EquipmentMapper
 * @typedef {import("../exerciseVariants/exerciseVariants.types.js").ExerciseVariantRow} ExerciseVariantRow
 * @typedef {import("../media/media.types.js").ResolvedMedia} ResolvedMedia
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
 * @property {number | null} ownerUserId
 * @property {boolean} isArchived
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
 * @property {number | null} exercise_variant_owner_user_id
 * @property {boolean} exercise_variant_is_archived
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
 * @property {string} variantCountLabel
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
 * @property {boolean} isPrivateOwner
 * @property {ResolvedMedia} media
 * @property {string} searchKeyWord
 * @property {{equipment: string[], environment: string[], scope: string[]}} filters
 * @property {{name: string, equipmentId: number | string | null | undefined, error: string | null} | null} [privateMutation]
 * @property {ExerciseTemplateVariantActions} actions
 */

/**
 * @typedef {object} ExerciseTemplateItemDetails
 * @property {ExerciseTemplateMovementItemPattern} movementPattern
 * @property {ResolvedMedia} media
 * @property {ExerciseTemplateMusclesViewModel} muscleTemplates
 * @property {ExerciseTemplateItemVariant[]} variants
 */

/**
 * @typedef {object} ExerciseTemplateVariantActions
 * @property {*} update
 * @property {boolean} canManageGlobal
 * @property {boolean} canManagePrivate
 */

/**
 * @typedef {object} ExerciseTemplateItemActions
 * @property {*} archive
 */

/**
 * @typedef {object} ExerciseTemplateItemViewModel
 * @property {ExerciseTemplateRow["id"]} id
 * @property {ExerciseTemplateRow["id"]} exerciseId
 * @property {string} baseName
 * @property {string} searchKeyWord
 * @property {number} variantCount
 * @property {string} baseSearchKeyWord
 * @property {{movement: string[], muscle: string[]}} filters
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
 * @property {number} variantCount
 * @property {string} countLabel
 * @property {{title: string, description: string, icon: string}} emptyState
 * @property {ExerciseTemplateItemViewModel[]} items
 * @property {ExerciseTemplateActions} actions
 * @property {{id: string, title: string, description: string, searchLabel: string, searchPlaceholder: string, filters: Array<{name: string, label: string, allLabel: string, level: "base" | "variant", options: Array<{value: string, label: string}>}>}} discovery
 */

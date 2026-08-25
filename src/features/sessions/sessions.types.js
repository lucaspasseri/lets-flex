/**
 * @typedef {import("../muscles/muscles.types.js").MuscleRow} MuscleRow
 * @typedef {import("../muscles/muscles.types.js").MuscleMapper} MuscleMapper
 */

/**
 * SQL raw data of a session step.
 *
 * @typedef {object} SessionQueryStepRow
 * @property {number} id
 * @property {string} name
 * @property {number} sets
 * @property {number} reps
 * @property {number} load_value
 * @property {string} load_unit
 * @property {number} step_order
 * @property {number} step_type_id
 * @property {string} step_type_name
 * @property {number} exercise_variant_id
 * @property {string} exercise_variant_name
 * @property {string} exercise_variant_setup_description
 * @property {string} exercise_variant_environment
 * @property {string} exercise_variant_notes
 * @property {string} exercise_name
 * @property {string} movement_pattern_name
 * @property {string} equipment_name
 * @property {string} equipment_category
 * @property {MuscleRow[]} muscles
 */

/**
 * SQL raw data of a session.
 *
 * @typedef {object} SessionRow
 * @property {number} id
 * @property {string} name
 * @property {string} notes
 * @property {boolean} is_archived
 * @property {SessionQueryStepRow[]} steps
 */

/**
 * @typedef {object} CreateSessionInput
 * @property {string} name
 * @property {string} notes
 */

/**
 * @typedef {object} FindByIdInput
 * @property {SessionRow["id"]} sessionId
 */

/**
 * @typedef {object} SessionMapperStepMuscle
 * @property {string} name
 * @property {string} variantName
 */

/**
 * @typedef {object} SessionMapperStepExercise
 * @property {string} name
 * @property {string} variantName
 * @property {string} setupDescription
 * @property {string} environment
 * @property {string} notes
 */

/**
 * @typedef {object} SessionMapperStepEquipment
 * @property {string} name
 * @property {string} category
 */

/**
 * Session Mapper Step
 *
 * @typedef {object} SessionMapperStep
 * @property {number} id
 * @property {string} name
 * @property {number} order
 * @property {number} [stepTypeId] Present for Library session aggregates.
 * @property {number} [exerciseVariantId] Present for Library session aggregates.
 * @property {string} type
 * @property {number} sets
 * @property {number} reps
 * @property {number} loadValue
 * @property {string} loadUnit
 * @property {string} movementPattern
 * @property {SessionMapperStepExercise} exercise
 * @property {SessionMapperStepEquipment} equipment
 * @property {MuscleMapper[]} muscles
 */

/**
 * Session Mapper
 *
 * @typedef {object} SessionMapper
 * @property {number} id
 * @property {string} name
 * @property {string} notes
 * @property {boolean} isArchived
 * @property {SessionMapperStep[]} steps
 */

/**
 * @typedef {object} SummaryViewModel
 * @property {SessionMapper["id"]} id
 * @property {string} name
 * @property {string} href
 * @property {boolean} isCurrent
 * @property {string} description
 * @property {string} stepCountLabel
 * @property {string} setCountLabel
 * @property {string} movementPatternsLabel
 * @property {string} musclesLabel
 * @property {string} equipmentsLabel
 * @property {string} searchKeyWord
 */

/**
 * @typedef {object} DetailsStepsExercise
 * @property {string} name
 * @property {string} variantName
 * @property {string} movementPattern
 * @property {string} equipment
 */

/**
 * @typedef {object} DetailsStepsPrescription
 * @property {number} sets
 * @property {number} reps
 * @property {number} loadValue
 * @property {string} loadUnit
 */

/**
 * @typedef {object} DetailsStepsViewModel
 * @property {SessionMapperStep["id"]} id
 * @property {number} order
 * @property {string} type
 * @property {DetailsStepsExercise} exercise
 * @property {DetailsStepsPrescription} prescription
 * @property {string} setupDescription
 * @property {string} environment
 * @property {string} notes
 *
 * @property {MuscleMapper[]} muscles
 */

/**
 * @typedef {object} Stat
 * @property {string} label
 * @property {number} value
 * @property {string} icon
 */

/**
 * @typedef {object} DetailsViewModel
 * @property {SessionMapper["id"]} id
 * @property {string} name
 * @property {string} headingId
 * @property {string} description
 * @property {string} notes
 * @property {boolean} isArchived
 * @property {number} stepNumber
 * @property {DetailsStepsViewModel[]} steps
 *
 * @property {Stat[]} stats
 *
 * @property {*} actions
 */

/**
 * @typedef {object} SessionWorkspaceCreateAction
 * @property {string} label
 * @property {string} modalId
 * @property {string} icon
 */

/**
 * @typedef {object} SessionWorkspaceSummariesViewModel
 * @property {string} id
 * @property {string} heading
 * @property {{message: string, icon: string}} emptyState
 * @property {SummaryViewModel[]} items
 */

/**
 * @typedef {object} SessionWorkspaceViewModel
 * @property {string} id
 * @property {string} heading
 * @property {SessionWorkspaceCreateAction} createAction
 * @property {SessionWorkspaceSummariesViewModel} summaries
 * @property {DetailsViewModel | null} details
 */

/**
 * @typedef {import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMuscleMapper} ExerciseTemplateMuscleMapper
 * @typedef {import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMusclesViewModel} ExerciseTemplateMusclesViewModel
 */

/**
 * @typedef {object} CreateMuscleTemplateInput
 * @property {ExerciseTemplateMuscleMapper[]} muscles
 */

/**
 * @param {CreateMuscleTemplateInput} input
 * @returns {ExerciseTemplateMusclesViewModel}
 */

function createMuscles({ muscles }) {
	const PRIMARY_MUSCLE_ROLE_ID = 1;
	const SECONDARY_MUSCLE_ROLE_ID = 7;

	return muscles.reduce(
		(template, muscle) => {
			const muscleRoleId = muscle.role?.id ?? null;

			if (muscleRoleId === PRIMARY_MUSCLE_ROLE_ID) {
				template.primary = {
					id: muscle.id,
					name: muscle.commonName,
				};
			}

			if (muscleRoleId === SECONDARY_MUSCLE_ROLE_ID) {
				template.secondary = {
					id: muscle.id,
					name: muscle.commonName,
				};
			}

			return template;
		},

		/** @type {ExerciseTemplateMusclesViewModel} */ ({}),
	);
}

export default createMuscles;

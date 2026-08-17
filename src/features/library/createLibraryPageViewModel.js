import createExerciseTemplates from "./createExerciseTemplatesViewModel.js";
import createSessionWorkspace from "./createSessionWorkspaceViewModel.js";

/**
 * @typedef {import("../../types/libraryPage.types.js").LocalsPage} LocalsPage
 * @typedef {import("../../types/libraryPage.types.js").LocalsLibraryPageState} LocalsLibraryPageState
 * @typedef {import("../../features/exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplatesViewModel} ExerciseTemplatesViewModel
 * @typedef {import("../../features/sessions/sessions.types.js").SessionWorkspaceViewModel} SessionWorkspaceViewModel
 */

/**
 * @typedef {object} LibraryPageViewModelInput
 * @property {LocalsPage} page
 * @property {LocalsLibraryPageState} pageState
 * @property {*} data
 */

/**
 * @typedef {object} FeaturesViewModel
 * @property {ExerciseTemplatesViewModel} exerciseTemplates
 * @property {SessionWorkspaceViewModel} sessionWorkspace
 */

/**
 * @typedef {object} LibraryViewModel
 * @property {LocalsPage} page
 * @property {LocalsLibraryPageState} pageState
 * @property {*} data
 * @property {*} appState
 * @property {FeaturesViewModel} features
 */

/**
 * @param {LibraryPageViewModelInput} input
 * @returns { LibraryViewModel}
 */

function createLibraryPageViewModel({ page, pageState, data }) {
	const {
		user,
		session,
		sessionArr = [],
		equipmentArr,
		movementPatternArr,
		muscleArr,
		muscleRoleArr,
		exerciseTemplateArr,
		stepTypeArr,
	} = data;

	const sessionWorkspace = createSessionWorkspace({
		sessionArr,
		activeSession: session,
	});

	const exerciseTemplates = createExerciseTemplates({ exerciseTemplateArr });

	return {
		page,
		pageState,
		appState: {
			user,
			session,
		},
		data: {
			sessions: {
				items: sessionArr,
			},
			equipments: {
				items: equipmentArr,
			},
			movementPatterns: {
				items: movementPatternArr,
			},
			muscles: {
				items: muscleArr,
			},
			muscleRoles: {
				items: muscleRoleArr,
			},
			exerciseTemplates: {
				items: exerciseTemplateArr,
			},
			stepTypes: {
				items: stepTypeArr,
			},
		},
		features: {
			sessionWorkspace,
			exerciseTemplates,
		},
	};
}

export default createLibraryPageViewModel;

import createSessionWorkspace from "../../../src/features/library/createSessionWorkspaceViewModel.js";
import createExerciseTemplates from "../../../src/features/library/createExerciseTemplatesViewModel.js";
import createSessionForm from "./createSessionFormViewModel.js";
import createExerciseForm from "./createExerciseFormViewModel.js";
import createDeleteExerciseForm from "./createDeleteExerciseFormViewModel.js";

/**
 * @typedef {import("../../../src/types/libraryPage.types.js").LocalsPage} LocalsPage
 * @typedef {import("../../../src/types/libraryPage.types.js").LocalsLibraryPageState} LibraryPageState
 * @typedef {import("../../../src/features/library/libraryPageData.types.js").LibraryPageData} LibraryPageData
 * @typedef {import("./libraryPage.types.js").LibraryPageViewModel} LibraryPageViewModel
 */

/**
 * @param {{page: LocalsPage, pageState: LibraryPageState, data: LibraryPageData}} input
 * @returns {LibraryPageViewModel}
 */
export default function createLibraryPageViewModel({ page, pageState, data }) {
	return {
		page,
		pageState,
		shell: {
			currentUser: data.user,
			activeSession: data.activeSession,
		},
		components: {
			sessionWorkspace: createSessionWorkspace({
				sessionArr: data.sessions,
				activeSession: data.activeSession,
			}),
			exerciseTemplates: createExerciseTemplates({
				exerciseTemplateArr: data.exerciseTemplates,
			}),
			createSessionForm: createSessionForm({
				stepTypes: data.stepTypes,
				exerciseTemplates: data.exerciseTemplates,
			}),
			createExerciseForm: createExerciseForm({
				equipments: data.equipments,
				movementPatterns: data.movementPatterns,
				muscles: data.muscles,
				muscleRoles: data.muscleRoles,
			}),
			deleteExerciseForm: createDeleteExerciseForm(),
		},
	};
}

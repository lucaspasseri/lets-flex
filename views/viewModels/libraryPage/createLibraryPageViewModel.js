import createSessionWorkspace from "../../../src/features/library/createSessionWorkspaceViewModel.js";
import createExerciseTemplates from "../../../src/features/library/createExerciseTemplatesViewModel.js";
import createSessionForm from "./createSessionFormViewModel.js";
import createExerciseForm from "./createExerciseFormViewModel.js";
import createDeleteExerciseForm from "./createDeleteExerciseFormViewModel.js";
import createArchiveSessionForm from "./createArchiveSessionFormViewModel.js";

/**
 * @typedef {import("../../../src/types/libraryPage.types.js").LocalsPage} LocalsPage
 * @typedef {import("../../../src/types/libraryPage.types.js").LocalsLibraryPageState} LibraryPageState
 * @typedef {import("../../../src/features/library/libraryPageData.types.js").LibraryPageData} LibraryPageData
 * @typedef {import("./libraryPage.types.js").LibraryPageViewModel} LibraryPageViewModel
 */

/**
 * @param {{page: LocalsPage, pageState: LibraryPageState, data: LibraryPageData, exerciseTemplateFormState?: Record<string, any>, sessionTemplateFormState?: Record<string, any>}} input
 * @returns {LibraryPageViewModel}
 */
export default function createLibraryPageViewModel({
	page,
	pageState,
	data,
	exerciseTemplateFormState,
	sessionTemplateFormState,
}) {
	return {
		page,
		pageState,
		shell: {
			currentUser: data.user,
			activeSession: data.activeSession,
			activeNavigation: "library",
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
			updateSessionForm: createSessionForm({
				stepTypes: data.stepTypes,
				exerciseTemplates: data.exerciseTemplates,
				state:
					sessionTemplateFormState?.mode === "update"
						? sessionTemplateFormState
						: {},
				mode: "update",
			}),
			createExerciseForm: createExerciseForm({
				equipments: data.equipments,
				movementPatterns: data.movementPatterns,
				muscles: data.muscles,
				muscleRoles: data.muscleRoles,
			}),
			updateExerciseForm: createExerciseForm({
				equipments: data.equipments,
				movementPatterns: data.movementPatterns,
				muscles: data.muscles,
				muscleRoles: data.muscleRoles,
				state:
					exerciseTemplateFormState?.mode === "update"
						? exerciseTemplateFormState
						: {},
				mode: "update",
			}),
			deleteExerciseForm: createDeleteExerciseForm(),
			archiveSessionForm: createArchiveSessionForm(),
		},
	};
}

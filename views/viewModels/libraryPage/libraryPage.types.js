/**
 * @typedef {import("../../../src/types/libraryPage.types.js").LocalsPage} LocalsPage
 * @typedef {import("../../../src/types/libraryPage.types.js").LocalsLibraryPageState} LibraryPageState
 * @typedef {import("../../../src/features/users/users.types.js").User} User
 * @typedef {import("../../../src/features/sessions/sessions.types.js").SessionMapper} Session
 * @typedef {import("../../../src/features/sessions/sessions.types.js").SessionWorkspaceViewModel} SessionWorkspaceViewModel
 * @typedef {import("../../../src/features/exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplatesViewModel} ExerciseTemplatesViewModel
 * @typedef {ReturnType<typeof import("./createSessionFormViewModel.js").default>} CreateSessionFormViewModel
 * @typedef {ReturnType<typeof import("./createExerciseFormViewModel.js").default>} CreateExerciseFormViewModel
 * @typedef {ReturnType<typeof import("./createDeleteExerciseFormViewModel.js").default>} DeleteExerciseFormViewModel
 * @typedef {ReturnType<typeof import("./createArchiveSessionFormViewModel.js").default>} ArchiveSessionFormViewModel
 */

/**
 * The only contract exposed to library.ejs.
 *
 * @typedef {object} LibraryPageViewModel
 * @property {LocalsPage} page
 * @property {LibraryPageState} pageState
 * @property {{currentUser: User | null, activeSession: Session | null, activeNavigation: "library"}} shell
 * @property {{sessionWorkspace: SessionWorkspaceViewModel, exerciseTemplates: ExerciseTemplatesViewModel, createSessionForm: CreateSessionFormViewModel, updateSessionForm: CreateSessionFormViewModel, createExerciseForm: CreateExerciseFormViewModel, updateExerciseForm: CreateExerciseFormViewModel, deleteExerciseForm: DeleteExerciseFormViewModel, archiveSessionForm: ArchiveSessionFormViewModel}} components
 */

export {};

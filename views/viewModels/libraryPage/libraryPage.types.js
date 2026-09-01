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
 * @property {boolean} managementMode
 * @property {{currentUser: User | null, activeSession: Session | null, activeNavigation: "library" | "admin-exercises"}} shell
 * @property {{pageHeading: {eyebrow: string, title: string, description: string, meta?: string}, sessionWorkspace: SessionWorkspaceViewModel, exerciseTemplates: ExerciseTemplatesViewModel, privateVariantForm: {idPrefix: string, title: string, eyebrow: string, description: string, submitLabel: string, actionPrefix: string, isGuest: boolean, exercises: Array<{id: number, name: string}>, equipments: any[]}, createSessionForm: CreateSessionFormViewModel, updateSessionForm: CreateSessionFormViewModel, createExerciseForm: CreateExerciseFormViewModel, updateExerciseForm: CreateExerciseFormViewModel, deleteExerciseForm: DeleteExerciseFormViewModel, archiveSessionForm: ArchiveSessionFormViewModel}} components
 */

export {};

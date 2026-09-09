import createSessionWorkspace from "../../../src/features/library/createSessionWorkspaceViewModel.js";
import createExerciseTemplates from "../../../src/features/library/createExerciseTemplatesViewModel.js";
import createSessionForm from "./createSessionFormViewModel.js";
import createExerciseForm from "./createExerciseFormViewModel.js";
import createDeleteExerciseForm from "./createDeleteExerciseFormViewModel.js";
import createArchiveSessionForm from "./createArchiveSessionFormViewModel.js";
import formatDayPageDate from "../dayPage/formatDayPageDate.js";

/**
 * @typedef {import("../../../src/types/libraryPage.types.js").LocalsPage} LocalsPage
 * @typedef {import("../../../src/types/libraryPage.types.js").LocalsLibraryPageState} LibraryPageState
 * @typedef {import("../../../src/features/library/libraryPageData.types.js").LibraryPageData} LibraryPageData
 * @typedef {import("./libraryPage.types.js").LibraryPageViewModel} LibraryPageViewModel
 */

/**
 * @param {{page: LocalsPage, pageState: LibraryPageState, data: LibraryPageData, exerciseTemplateFormState?: Record<string, any>, sessionTemplateFormState?: Record<string, any>, managementMode?: boolean}} input
 * @returns {LibraryPageViewModel}
 */
export default function createLibraryPageViewModel({
	page,
	pageState,
	data,
	exerciseTemplateFormState,
	sessionTemplateFormState,
	managementMode = false,
}) {
	const visibleExerciseTemplates = managementMode
		? data.exerciseTemplates.filter(
				(exerciseTemplate) => exerciseTemplate.variant?.ownerUserId == null,
			)
		: data.exerciseTemplates;
	const isGuest = data.user?.role === "guest";
	const sessionCreationContext = data.sessionCreationContext;
	const dayTitle = sessionCreationContext
		? sessionCreationContext.day.label?.trim() ||
			`Day ${sessionCreationContext.day.dayOrder}`
		: null;

	return {
		page,
		pageState,
		managementMode,
		shell: {
			currentUser: data.user,
			activeSession: data.activeSession,
			activeNavigation: managementMode ? "admin-exercises" : "library",
		},
		components: {
			planningContext: sessionCreationContext
				? {
						isVisible: true,
						title: `Create a session for ${dayTitle}`,
						description:
							"Build the reusable template here. After creation, you will return to the training day to explicitly assign it.",
						pathLabel: `${sessionCreationContext.program.name} · ${sessionCreationContext.cycle.name} · ${dayTitle}`,
						dateLabel:
							formatDayPageDate(sessionCreationContext.day.scheduledDate) ??
							"Date not scheduled",
						backHref: `/programs/day?dayId=${sessionCreationContext.day.id}`,
					}
				: { isVisible: false },
			pageHeading: managementMode
				? {
						eyebrow: "Administration",
						title: "Exercise catalog",
						description:
							"Manage the global exercises and sample variants available to every workspace.",
						meta: "Admin only",
					}
				: {
						eyebrow: "Training assets",
						title: "Library",
						description:
							"Build reusable sessions and personalize global exercises with private variants.",
					},
			sessionWorkspace: createSessionWorkspace({
				sessionArr: data.sessions,
				activeSession: data.activeSession,
				actorUserId: pageState.userId,
			}),
			exerciseTemplates: createExerciseTemplates({
				exerciseTemplateArr: visibleExerciseTemplates,
				actorUserId: pageState.userId,
				managementMode,
			}),
			privateVariantForm: {
				idPrefix: managementMode ? "global-variant" : "private-variant",
				title: managementMode ? "Add a global variant" : "Create your variant",
				eyebrow: managementMode ? "Global catalog" : "Personalize an exercise",
				description: managementMode
					? "Add an equipment-specific sample variant that every workspace can use."
					: isGuest
						? "This variant belongs only to your guest workspace and will be removed when the workspace expires."
						: "This variant belongs only to your account. Other members and administrators cannot access it.",
				submitLabel: managementMode
					? "Create global variant"
					: "Create private variant",
				actionPrefix: managementMode ? "/admin/library/exercises" : "/exercises",
				isGuest,
				exercises: [
					...new Map(
						visibleExerciseTemplates.map((item) => [
							item.id,
							{ id: item.id, name: item.name },
						]),
					).values(),
				],
				equipments: data.equipments,
			},
			createSessionForm: createSessionForm({
				stepTypes: data.stepTypes,
				exerciseTemplates: data.exerciseTemplates,
				state:
					sessionTemplateFormState?.mode === "create" ? sessionTemplateFormState : {},
				creationContext: sessionCreationContext,
			}),
			updateSessionForm: createSessionForm({
				stepTypes: data.stepTypes,
				exerciseTemplates: data.exerciseTemplates,
				state:
					sessionTemplateFormState?.mode === "update" ? sessionTemplateFormState : {},
				mode: "update",
			}),
			createExerciseForm: createExerciseForm({
				equipments: data.equipments,
				movementPatterns: data.movementPatterns,
				muscles: data.muscles,
				muscleRoles: data.muscleRoles,
				state:
					exerciseTemplateFormState?.mode === "create" ? exerciseTemplateFormState : {},
			}),
			updateExerciseForm: createExerciseForm({
				equipments: data.equipments,
				movementPatterns: data.movementPatterns,
				muscles: data.muscles,
				muscleRoles: data.muscleRoles,
				state:
					exerciseTemplateFormState?.mode === "update" ? exerciseTemplateFormState : {},
				mode: "update",
			}),
			deleteExerciseForm: createDeleteExerciseForm(),
			archiveSessionForm: createArchiveSessionForm(),
		},
	};
}

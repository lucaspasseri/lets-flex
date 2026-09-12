import createSessionWorkspace from "../../../src/features/library/createSessionWorkspaceViewModel.js";
import createExerciseTemplates from "../../../src/features/library/createExerciseTemplatesViewModel.js";
import createSessionForm from "./createSessionFormViewModel.js";
import createExerciseForm from "./createExerciseFormViewModel.js";
import createDeleteExerciseForm from "./createDeleteExerciseFormViewModel.js";
import createDeleteSessionForm from "./createDeleteSessionFormViewModel.js";
import formatDayPageDate from "../dayPage/formatDayPageDate.js";
import createViewModelTranslator from "../translate.js";

/**
 * @typedef {import("../../../src/types/libraryPage.types.js").LocalsPage} LocalsPage
 * @typedef {import("../../../src/types/libraryPage.types.js").LocalsLibraryPageState} LibraryPageState
 * @typedef {import("../../../src/features/library/libraryPageData.types.js").LibraryPageData} LibraryPageData
 * @typedef {import("./libraryPage.types.js").LibraryPageViewModel} LibraryPageViewModel
 */

/**
 * @param {{page: LocalsPage, pageState: LibraryPageState, data: LibraryPageData, exerciseTemplateFormState?: Record<string, any>, sessionTemplateFormState?: Record<string, any>, variantFormState?: Record<string, any>, privateVariantMutationState?: Record<string, any>, pageFeedback?: {tone?: string, eyebrow?: string, id?: string, title: string, message: string} | null, managementMode?: boolean, translate?: Function}} input
 * @returns {LibraryPageViewModel}
 */
export default function createLibraryPageViewModel({
	page,
	pageState,
	data,
	exerciseTemplateFormState,
	sessionTemplateFormState,
	variantFormState,
	privateVariantMutationState,
	pageFeedback = null,
	managementMode = false,
	translate,
}) {
	const t = createViewModelTranslator(translate);
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
			pageFeedback,
			planningContext: sessionCreationContext
				? {
						isVisible: true,
						title: `${t("library.createSessionFor", { defaultValue: "Create a session for {{day}}", day: dayTitle })}`,
						description: t("library.createSessionDescription", {
							defaultValue:
								"Build the reusable template here. After creation, you will return to the training day to explicitly assign it.",
						}),
						pathLabel: `${sessionCreationContext.program.name} · ${sessionCreationContext.cycle.name} · ${dayTitle}`,
						dateLabel:
							formatDayPageDate(sessionCreationContext.day.scheduledDate) ??
							"Date not scheduled",
						backHref: `/programs/day?dayId=${sessionCreationContext.day.id}`,
					}
				: { isVisible: false },
			pageHeading: managementMode
				? {
						eyebrow: t("library.administration", { defaultValue: "Administration" }),
						title: t("library.exerciseCatalog", { defaultValue: "Exercise catalog" }),
						description: t("library.catalogDescription", {
							defaultValue:
								"Manage the global exercises and sample variants available to every workspace.",
						}),
						meta: t("library.adminOnly", { defaultValue: "Admin only" }),
					}
				: {
						eyebrow: t("library.trainingAssets", { defaultValue: "Training assets" }),
						title: t("library.title", { defaultValue: "Library" }),
						description: t("library.description", {
							defaultValue:
								"Build reusable sessions and personalize global exercises with private variants.",
						}),
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
				privateVariantMutationState,
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
				values: variantFormState?.values ?? {},
				errors: variantFormState?.errors ?? { fieldErrors: {}, formErrors: [] },
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
			deleteSessionForm: createDeleteSessionForm(),
		},
	};
}

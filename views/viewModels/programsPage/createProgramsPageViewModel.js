import createProgramSwitcherViewModel from "./createProgramSwitcherViewModel.js";
import createCycleSwitcherViewModel from "./createCycleSwitcherViewModel.js";
import createCalendarNavigationViewModel from "./createCalendarNavigationViewModel.js";
import createProgramFormViewModel from "./createProgramFormViewModel.js";
import createCycleFormViewModel from "./createCycleFormViewModel.js";
import createDeleteEntityFormViewModel from "./createDeleteEntityFormViewModel.js";
import createHierarchyGuideViewModel from "./createHierarchyGuideViewModel.js";
import createViewModelTranslator from "../translate.js";

/**
 * @typedef {import("../../../src/features/programs/programsPage.types.js").CreateProgramsPageViewModelInput} CreateProgramsPageViewModelInput
 * @typedef {import("./programsPage.types.js").ProgramsPageViewModel} ProgramsPageViewModel
 */

/**
 * @param {CreateProgramsPageViewModelInput & {translate?: Function}} input
 * @returns {ProgramsPageViewModel}
 */
export default function createProgramsPageViewModel({
	page,
	pageState,
	data,
	programFormState,
	cycleFormState,
	pageFeedback = null,
	translate,
}) {
	const t = createViewModelTranslator(translate);
	const {
		currentUser,
		programs,
		cycles,
		trainingDays,
		workoutSessions = [],
		goals,
	} = data;

	return {
		page: {
			...page,
			title: `${t("programs.title", { defaultValue: "Programs" })} · Let's Flex!`,
		},
		pageState,
		shell: {
			currentUser,
			activeNavigation: "programs",
		},
		components: {
			pageFeedback,
			pageHeading: {
				eyebrow: t("programs.eyebrow", { defaultValue: "Training plans" }),
				title: t("programs.title", { defaultValue: "Programs" }),
				description: t("programs.description", {
					defaultValue:
						"Build from an overall goal down to the session assigned to each training day.",
				}),
			},
			hierarchyGuide: createHierarchyGuideViewModel({
				currentProgram: programs.current,
				currentCycle: cycles.current,
				trainingDays,
				workoutSessions,
			}),
			programSwitcher: createProgramSwitcherViewModel({
				currentProgramId: programs.current?.id ?? null,
				programs: programs.items,
				goals,
			}),
			cycleSwitcher: createCycleSwitcherViewModel({
				currentProgram: programs.current,
				currentCycleId: cycles.current?.id ?? null,
				cycles: cycles.items,
			}),
			calendarNavigation: createCalendarNavigationViewModel({
				currentProgram: programs.current,
				currentCycle: cycles.current,
				trainingDays,
				workoutSessions,
				translate,
			}),
			createProgramForm: createProgramFormViewModel({
				goals,
				state: programFormState,
			}),
			createCycleForm: createCycleFormViewModel({
				currentProgram: programs.current,
				cycles: cycles.items,
				state: cycleFormState,
			}),
			deleteProgramForm: createDeleteEntityFormViewModel("program"),
			deleteCycleForm: createDeleteEntityFormViewModel("cycle"),
			noActiveUser: {
				isVisible: currentUser === null,
				title: t("programs.noActiveProfile", { defaultValue: "No active profile" }),
				description: t("programs.noActiveProfileDescription", {
					defaultValue: "Create or select a profile before managing training programs.",
				}),
				action: {
					label: t("programs.chooseProfile", { defaultValue: "Choose a profile" }),
					href: "/profile",
					icon: "plus",
				},
			},
		},
	};
}

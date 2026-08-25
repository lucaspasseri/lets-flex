import createProgramSwitcherViewModel from "./createProgramSwitcherViewModel.js";
import createCycleSwitcherViewModel from "./createCycleSwitcherViewModel.js";
import createCalendarNavigationViewModel from "./createCalendarNavigationViewModel.js";
import createProgramFormViewModel from "./createProgramFormViewModel.js";
import createCycleFormViewModel from "./createCycleFormViewModel.js";
import createDeleteEntityFormViewModel from "./createDeleteEntityFormViewModel.js";

/**
 * @typedef {import("../../../src/features/programs/programsPage.types.js").CreateProgramsPageViewModelInput} CreateProgramsPageViewModelInput
 * @typedef {import("./programsPage.types.js").ProgramsPageViewModel} ProgramsPageViewModel
 */

/**
 * @param {CreateProgramsPageViewModelInput} input
 * @returns {ProgramsPageViewModel}
 */
export default function createProgramsPageViewModel({
	page,
	pageState,
	data,
	programFormState,
	cycleFormState,
}) {
	const {
		currentUser,
		programs,
		cycles,
		trainingDays,
		workoutSessions = [],
		goals,
	} = data;

	return {
		page,
		pageState,
		shell: {
			currentUser,
			activeNavigation: "programs",
		},
		components: {
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
				title: "No active profile",
				description: "Create or select a profile before managing training programs.",
				action: { label: "Choose a profile", href: "/profile", icon: "plus" },
			},
		},
	};
}

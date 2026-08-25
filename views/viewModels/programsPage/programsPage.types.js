/**
 * @typedef {import("../../../src/features/programs/programsPage.types.js").LocalsPage} LocalsPage
 * @typedef {import("../../../src/features/programs/programsPage.types.js").PageState} PageState
 * @typedef {import("../../../src/features/users/users.types.js").User} User
 * @typedef {ReturnType<typeof import("./createProgramSwitcherViewModel.js").default>} ProgramSwitcherViewModel
 * @typedef {ReturnType<typeof import("./createCycleSwitcherViewModel.js").default>} CycleSwitcherViewModel
 * @typedef {ReturnType<typeof import("./createCalendarNavigationViewModel.js").default>} CalendarNavigationViewModel
 * @typedef {ReturnType<typeof import("./createProgramFormViewModel.js").default>} CreateProgramFormViewModel
 * @typedef {ReturnType<typeof import("./createCycleFormViewModel.js").default>} CreateCycleFormViewModel
 * @typedef {ReturnType<typeof import("./createDeleteEntityFormViewModel.js").default>} DeleteEntityFormViewModel
 */

/**
 * @typedef {object} ProgramsPageViewModel
 * @property {LocalsPage} page
 * @property {PageState} pageState
 * @property {{currentUser: User | null, activeNavigation: "programs"}} shell
 * @property {{programSwitcher: ProgramSwitcherViewModel, cycleSwitcher: CycleSwitcherViewModel, calendarNavigation: CalendarNavigationViewModel, createProgramForm: CreateProgramFormViewModel, createCycleForm: CreateCycleFormViewModel, deleteProgramForm: DeleteEntityFormViewModel, deleteCycleForm: DeleteEntityFormViewModel, noActiveUser: {isVisible: boolean, title: string, description: string, action: {label: string, href: string, icon: string}}}} components
 */

export {};

/**
 * @typedef {import("../../../src/types/profilePage.types.js").LocalsPage} LocalsPage
 * @typedef {import("../../../src/types/profilePage.types.js").LocalsProfilePageState} ProfilePageState
 * @typedef {import("../../../src/features/users/users.types.js").User} User
 * @typedef {ReturnType<typeof import("./createProfilePickerViewModel.js").default>} ProfilePickerViewModel
 * @typedef {ReturnType<typeof import("./createUserFormViewModel.js").default>} CreateUserFormViewModel
 */

/**
 * View contract delivered to profile.ejs.
 *
 * @typedef {object} ProfilePageViewModel
 * @property {LocalsPage} page
 * @property {ProfilePageState} pageState
 * @property {{currentUser: User | null, activeNavigation: "profile"}} shell
 * @property {{profilePicker: ProfilePickerViewModel, createUserForm: CreateUserFormViewModel}} components
 */

export {};

import createProfilePickerViewModel from "./createProfilePickerViewModel.js";
import createUserFormViewModel from "./createUserFormViewModel.js";

/**
 * @typedef {import("../../../src/types/profilePage.types.js").LocalsPage} LocalsPage
 * @typedef {import("../../../src/types/profilePage.types.js").LocalsProfilePageState} ProfilePageState
 * @typedef {import("../../../src/features/profile/profilePageData.types.js").ProfilePageData} ProfilePageData
 * @typedef {import("./profilePage.types.js").ProfilePageViewModel} ProfilePageViewModel
 * @typedef {import("./createUserFormViewModel.js").CreateUserFormState} CreateUserFormState
 */

/**
 * @param {{page: LocalsPage, pageState: ProfilePageState, data: ProfilePageData, createUserFormState?: CreateUserFormState}} input
 * @returns {ProfilePageViewModel}
 */
export default function createProfilePageViewModel({
	page,
	pageState,
	data,
	createUserFormState,
}) {
	return {
		page,
		pageState,
		shell: {
			currentUser: data.currentUser,
			activeNavigation: "profile",
		},
		components: {
			profilePicker: createProfilePickerViewModel({
				currentUserId: data.currentUser?.id ?? null,
				users: data.users,
			}),
			createUserForm: createUserFormViewModel(createUserFormState),
		},
	};
}

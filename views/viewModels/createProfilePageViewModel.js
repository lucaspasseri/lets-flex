import createUserSwitcherViewModel from "../viewModels/createUserSwitcherViewModel.js";

/**
 * @typedef {import("../../src/types/profilePage.types.js").LocalsPage} LocalsPage
 * @typedef {import("../../src/types/profilePage.types.js").LocalsProfilePageState} LocalsProfilePageState
 * @typedef {import("../../src/features/users/users.types.js").User} User
 */

/**
 * @typedef {ReturnType<typeof createUserSwitcherViewModel>} UserSwitcherViewModel
 */

/**
 * @typedef {object} CreateProfilePageViewModelInput
 * @property {LocalsPage} page
 * @property {LocalsProfilePageState} pageState
 * @property {User | null} user
 * @property {User[]} userArr
 */

/**
 * @typedef {object} ProfilePageAppState
 * @property {object} users
 * @property {User | null} users.current
 * @property {User[]} users.items
 */

/**
 * @typedef {object} ProfilePageFeatures
 * @property {UserSwitcherViewModel} userSwitcher
 */

/**
 * @typedef {object} ProfilePageViewModel
 * @property {LocalsPage} page
 * @property {LocalsProfilePageState} pageState
 * @property {ProfilePageAppState} appState
 * @property {ProfilePageFeatures} features
 */

/**
 * Creates the complete view model for the profile page.
 *
 * @param {CreateProfilePageViewModelInput} input
 * @returns {ProfilePageViewModel}
 */
function createProfilePageViewModel({ page, pageState, user, userArr }) {
	return {
		page,
		pageState,
		appState: {
			users: {
				current: user,
				items: userArr,
			},
		},
		features: {
			userSwitcher: createUserSwitcherViewModel({ user, userArr }),
		},
	};
}

export default createProfilePageViewModel;

/**
 * @typedef {import("../../src/features/users/users.types.js").User} User
 */

/**
 * @typedef {object} UserSwitcherInput
 * @property {User["id"] | null} userId
 * @property {User[]} userArr
 */

/**
 * @typedef {object} UserSwitcherItem
 * @property {User["id"]} id
 * @property {string} name
 * @property {boolean} isActive
 * @property {string} href
 */

/**
 * @typedef {object} UserSwitcherAction
 * @property {string} label
 * @property {string} modalId
 */

/**
 * @typedef {object} UserSwitcherViewModel
 * @property {string} id
 * @property {string} label
 * @property {number} headingLevel
 * @property {UserSwitcherItem[]} items
 * @property {UserSwitcherAction} addAction
 */

/**
 * Creates the data required by the user switcher component.
 *
 * @param {UserSwitcherInput} input
 * @returns {UserSwitcherViewModel}
 */
function createUserSwitcherViewModel({ userId = null, userArr = [] }) {
	return {
		id: "profilePageUserSwitcher",
		label: userArr.length === 0 ? "Create user" : "Switch user",
		headingLevel: 1,
		items: userArr.map(userItem => ({
			id: userItem.id,
			name: userItem.name,
			isActive: userItem.id === userId,
			href: `/profile?userId=${userItem.id}`,
		})),
		addAction: {
			label: "Create user",
			modalId: "createUserModal",
		},
	};
}

export default createUserSwitcherViewModel;

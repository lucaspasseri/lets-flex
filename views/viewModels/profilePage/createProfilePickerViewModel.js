/**
 * @typedef {import("../../../src/features/users/users.types.js").User} User
 */

/**
 * @param {{currentUserId: User["id"] | null, users: User[]}} input
 */
export default function createProfilePickerViewModel({ currentUserId, users }) {
	const currentUser = users.find((user) => user.id === currentUserId) ?? null;

	return {
		id: "profile-picker",
		eyebrow: "Profiles",
		heading: users.length === 0 ? "Create your profile" : "Who is training?",
		description: "Choose the profile used for programs, sessions, and workout history.",
		items: users.map((user) => ({
			id: user.id,
			name: user.name,
			initials: getInitials(user.name),
			href: `/profile?userId=${user.id}`,
			isCurrent: user.id === currentUserId,
			statusLabel: user.id === currentUserId ? "Active profile" : null,
			accessibleLabel:
				user.id === currentUserId
					? `${user.name}, active profile`
					: `Use ${user.name}'s profile`,
		})),
		emptyState: {
			title: "Create your first profile",
			description: "Profiles keep each person's programs and workout history separate.",
			icon: "guestUser",
		},
		createAction: {
			label: "New profile",
			accessibleLabel: "Create a new profile",
			modalId: "createUserModal",
			icon: "plus",
		},
		clearSelectionAction: {
			isVisible: currentUser !== null,
			label: "Use as guest",
			accessibleLabel: currentUser
				? `Stop using ${currentUser.name}'s profile and use the app as a guest`
				: "Use the app as a guest",
			modal: {
				id: "clear-profile-selection-modal",
				title: "Use the app without a profile?",
			},
			form: {
				id: "clear-profile-selection-form",
				action: "/profile/clear-selection",
				method: "POST",
				heading: "Use the app without a profile?",
				description: currentUser
					? `${currentUser.name} will no longer be the active profile on this device. No programs, sessions, or workout history will be deleted.`
					: "No active profile will be used on this device.",
				actions: {
					cancel: {
						label: currentUser ? `Keep ${currentUser.name} active` : "Cancel",
					},
					submit: { label: "Use as guest" },
				},
			},
		},
	};
}

/** @param {string} name */
function getInitials(name) {
	return (
		name
			.trim()
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part.charAt(0).toUpperCase())
			.join("") || "?"
	);
}

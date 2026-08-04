function createUserSwitcherViewModel({ user, userArr }) {
	return {
		id: "profilePageUserSwitcher",
		label: userArr.length === 0 ? "Create user" : "Switch user",
		headingLevel: 1,
		items: userArr.map(userItem => ({
			id: userItem.id,
			name: userItem.name,
			isActive: userItem.id === user?.id,
			href: `/profile/?userId=${userItem.id}`,
		})),
		addAction: {
			label: "Create user",
			modalId: "createUserModal",
		},
	};
}

export default createUserSwitcherViewModel;

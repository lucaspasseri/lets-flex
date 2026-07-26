function createProfilePageViewModel({ page, pageState, data }) {
	const { user, userArr } = data;

	const profile = {
		page,
		pageState,
		appState: {
			user,
		},
		data: {
			users: {
				items: userArr,
			},
		},
	};

	return profile;
}

export default createProfilePageViewModel;

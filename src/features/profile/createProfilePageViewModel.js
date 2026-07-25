function createProfilePageViewModel({ page, data }) {
	const { user, userArr } = data;

	const profile = {
		page,
		pageState: {
			userId: user?.id,
		},
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

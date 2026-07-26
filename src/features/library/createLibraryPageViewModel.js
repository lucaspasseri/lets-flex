function createLibraryPageViewModel({ page, pageState, data }) {
	const {
		user,
		session,
		sessionArr,
		equipmentArr,
		movementPatternArr,
		muscleArr,
		muscleRoleArr,
		exerciseTemplateArr,
		stepTypeArr,
	} = data;

	return {
		page,
		pageState,
		appState: {
			user,
			session,
		},
		data: {
			sessions: {
				items: sessionArr,
			},
			equipments: {
				items: equipmentArr,
			},
			movementPatterns: {
				items: movementPatternArr,
			},
			muscles: {
				items: muscleArr,
			},
			muscleRoles: {
				items: muscleRoleArr,
			},
			exerciseTemplates: {
				items: exerciseTemplateArr,
			},
			stepTypes: {
				items: stepTypeArr,
			},
		},
	};
}

export default createLibraryPageViewModel;

function createMuscleTemplate({ muscles }) {
	const PRIMARY_MUSCLE_ROLE_ID = 1;
	const SECONDARY_MUSCLE_ROLE_ID = 7;

	const muscleTemplate = muscles.reduce((template, muscle) => {
		const muscleRoleId = muscle?.role?.id ?? null;

		if (muscleRoleId === PRIMARY_MUSCLE_ROLE_ID) {
			template.primary = { id: muscle.id, name: muscle.commonName };
		}

		if (muscleRoleId === SECONDARY_MUSCLE_ROLE_ID) {
			template.secondary = { id: muscle.id, name: muscle.commonName };
		}

		return template;
	}, {});

	return muscleTemplate;
}

export default createMuscleTemplate;

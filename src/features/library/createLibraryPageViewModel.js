function createLibraryPageViewModel({ page, pageState, data }) {
	const {
		user,
		session,
		sessionArr = [],
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
		features: {
			sessionWorkspace: {
				id: "session-workspace",
				heading: "Session templates",

				createAction: {
					label: "Create session",
					modalId: "createSessionModal",
					icon: "plus",
				},

				summaries: {
					id: "session-summaries",
					heading: "Sessions",
					emptyMessage: "No session templates have been created yet.",

					items: sessionArr?.map(session =>
						createSessionSummaryViewModel({ session }),
					),
				},

				details: createSessionDetailsViewModel({ session }),
			},
		},
	};
}

function createSessionSummaryViewModel({ session }) {
	return {
		id: session.id,
		name: session.name,
		href: `/library?sessionId=${session.id}`,
		isCurrent: session.isCurrent,

		description: session.description,
		stepCountLabel: `${session.stepCount} exercises`,
		setCountLabel: `${session.workingSetCount} sets`,

		movementPatterns: session.movementPatternArr?.map(
			movementPattern => movementPattern.name,
		),
	};
}

function createSessionDetailsViewModel({ session }) {
	if (!session) {
		return null;
	}

	return {
		id: session.id,
		headingId: `session-details-title-${session.id}`,
		name: session.name,
		description: session.description,
		notes: session.notes,
		isArchived: session.isArchived,

		stats: [
			{
				label: "Exercises",
				value: session.exerciseCount,
				icon: "dumbbell",
			},
			{
				label: "Working sets",
				value: session.workingSetCount,
				icon: "layers",
			},
			{
				label: "Movement patterns",
				value: session.movementPatternCount,
				icon: "activity",
			},
			{
				label: "Equipment",
				value: session.equipmentCount,
				icon: "wrench",
			},
		],

		equipment: session.equipmentArr?.map(equipment => equipment.name),

		movementPatterns: session.movement,
		steps: session.steps?.map(createStepViewModel),

		actions: {
			edit: {
				label: "Edit session",
				href: `/sessions/${session.id}/edit`,
			},
			archive: {
				label: "Archive session",
				action: `/sessions/${session.id}/archive`,
			},
		},
	};
}

function createStepViewModel(step) {
	return {
		id: step.id,
		order: step.order,
		type: {
			id: step.type.id,
			name: step.type.name,
		},

		exercise: {
			name: step.exercise.name,
			variantName: step.exercise.variantName,
			movementPattern: step.exercise.movementPattern,
			equipment: step.exercise.equipment,
		},

		prescription: {
			// sets: step.prescription.sets,
			// reps: step.prescription.reps,
			// loadValue: step.prescription.loadValue,
			// loadUnit: step.prescription.loadUnit,
			// summary: step.prescription.summary,
		},

		setupDescription: step.setupDescription,

		notes: step.notes,

		muscles: {
			primary: step.muscles.primary?.map(muscle => muscle.name),
			secondary: step.muscles.secondary?.map(muscle => muscle.name),
		},
	};
}

export default createLibraryPageViewModel;

// const sessionWorkspace = {
// 	id: "session-workspace",
// 	heading: "Session templates",

// 	createAction: {
// 		label: "Create session",
// 		modalId: "createSessionModal",
// 		icon: "plus",
// 	},

// 	summaries: {
// 		id: "session-summaries",
// 		heading: "Sessions",
// 		emptyMessage: "No session templates have been created yet.",

// 		items: [
// 			{
// 				id: 12,
// 				name: "Upper-body strength",
// 				href: "/library?sessionId=12",
// 				isCurrent: true,

// 				description: "Chest, back, shoulders and arms",
// 				stepCountLabel: "6 exercises",
// 				setCountLabel: "20 sets",

// 				movementPatterns: ["Horizontal push", "Horizontal pull"],
// 			},
// 		],
// 	},

// 	details: {
// 		id: 12,
// 		headingId: "session-details-title-12",
// 		name: "Upper-body strength",
// 		description: "Chest, back, shoulders and arms",
// 		notes: "Prioritize controlled repetitions and proper form.",
// 		isArchived: false,

// 		stats: [
// 			{
// 				label: "Exercises",
// 				value: "6",
// 				icon: "dumbbell",
// 			},
// 			{
// 				label: "Working sets",
// 				value: "20",
// 				icon: "layers",
// 			},
// 			{
// 				label: "Movement patterns",
// 				value: "4",
// 				icon: "activity",
// 			},
// 			{
// 				label: "Equipment",
// 				value: "3",
// 				icon: "wrench",
// 			},
// 		],

// 		equipment: ["Barbell", "Bench", "Cable machine"],

// 		movementPatterns: [
// 			"Horizontal push",
// 			"Horizontal pull",
// 			"Vertical push",
// 			"Elbow flexion",
// 		],

// 		steps: [
// 			{
// 				id: 81,
// 				order: 1,
// 				type: {
// 					id: 1,
// 					name: "Exercise",
// 				},

// 				exercise: {
// 					name: "Bench press",
// 					variantName: "Barbell bench press",
// 					movementPattern: "Horizontal push",
// 					equipment: "Barbell",
// 				},

// 				prescription: {
// 					sets: 4,
// 					reps: 8,
// 					loadValue: 60,
// 					loadUnit: "kg",
// 					summary: "4 sets × 8 reps at 60 kg",
// 				},

// 				setupDescription:
// 					"Lie on the bench with your feet firmly planted on the floor.",

// 				notes: "Keep the shoulder blades retracted.",

// 				muscles: {
// 					primary: ["Pectoralis major"],
// 					secondary: ["Anterior deltoid", "Triceps brachii"],
// 				},
// 			},
// 		],

// 		actions: {
// 			edit: {
// 				label: "Edit session",
// 				href: "/sessions/12/edit",
// 			},
// 			archive: {
// 				label: "Archive session",
// 				action: "/sessions/12/archive",
// 			},
// 		},
// 	},
// };

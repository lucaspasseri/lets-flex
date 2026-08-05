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

	console.log({ session, session0: sessionArr?.[0] });

	console.log({
		step: session?.steps?.[0],
		step0: sessionArr?.[0]?.steps?.[0],
	});

	function createSessionSummaryViewModel({ item }) {
		return {
			id: item.id,
			name: item.name,
			href: `/library?sessionId=${item.id}`,
			isCurrent: item.id === session?.id,
			description: item.description ?? "Remember, safety first.",
			stepCountLabel: `${item.steps?.length || 0} exercises`,
			setCountLabel: `${item.steps.reduce((acc, curr) => acc + curr.sets, 0)} sets`,
			// still repeating movement patterns
			movementPatterns: item.steps.reduce(
				(acc, curr) => acc + curr.movementPattern + " ",
				"",
			),
			searchKeyWord: `${item.name} ${getDistinctMuscles(item)}`,
		};
	}

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

					items: sessionArr?.map(item =>
						createSessionSummaryViewModel({ item }),
					),
				},

				details: createSessionDetailsViewModel({ session }),
			},
		},
	};
}

function createSessionDetailsViewModel({ session }) {
	if (!session) {
		return {};
	}

	return {
		id: session.id,
		headingId: `session-details-title-${session.id}`,
		name: session.name,
		description: session.description ?? "Remember, safety first.",
		notes: session.notes,
		isArchived: session.isArchived,

		stats: [
			{
				label: "Exercises",
				value: session.steps?.length || 0,
				icon: "dumbbell",
			},
			{
				label: "Working sets",
				value: session.steps.reduce((acc, curr) => acc + curr.sets, 0),
				icon: "layers",
			},
			{
				label: "Movement patterns",
				value: session.steps.reduce(
					(acc, curr) => acc + curr.movementPattern + "",
					"",
				),
				icon: "activity",
			},
			{
				label: "Equipment",
				value: session.steps.reduce(
					(acc, curr) => acc + curr.equipment.name + "",
					"",
				),
				icon: "wrench",
			},
		],

		// equipment: session.steps.map(step => step.equipment.name),
		equipment: "BRA BRA BRASIL",

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
	console.log("Oi, Boa noite!");
	console.log({ step });
	return {
		id: step.id,
		order: step.order,
		type: step.type,

		exercise: {
			name: step.exercise.name,
			variantName: step.exercise.variantName,
			movementPattern: step.movementPattern,
			equipment: step.equipment.name,
		},

		prescription: {
			sets: step.sets,
			reps: step.reps,
			loadValue: step.loadValue,
			loadUnit: step.loadUnit,
			// I think it is the only property of prescription that is in use
			summary: step.summary ?? "Stay safe and lift smart!",
		},

		setupDescription: step.setupDescription ?? "-",

		notes: step.notes ?? "-",

		muscles: step.muscles ?? [],
	};
}

export default createLibraryPageViewModel;

function getDistinctMuscles(session) {
	const distinctSessions = new Set();

	session.steps.forEach(step => {
		step.muscles.forEach(muscle => {
			distinctSessions.add(muscle.commonName);
		});
	});

	const iterator = distinctSessions.values();
	let output = "";
	let condition = true;
	while (condition) {
		const currValue = iterator.next().value;
		if (currValue === undefined) {
			condition = false;
			continue;
		}

		if (output === "") {
			output = currValue;
		} else {
			output += ` ${currValue}`;
		}
	}
	console.log({ output });
	return output;
}

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

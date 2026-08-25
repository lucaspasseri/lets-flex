import formatProgramsPageDate from "./formatProgramsPageDate.js";

/**
 * @typedef {import("../../../src/features/programs/programs.types.js").Program} Program
 * @typedef {import("../../../src/features/goals/goals.types.js").Goal} Goal
 */

/**
 * @param {{currentProgramId: Program["id"] | null, programs: Program[], goals: Goal[]}} input
 */
export default function createProgramSwitcherViewModel({
	currentProgramId,
	programs,
	goals,
}) {
	const goalsById = new Map(goals.map((goal) => [goal.id, goal]));

	return {
		id: "program-switcher",
		eyebrow: "Programs",
		heading: programs.length === 0 ? "Create your first program" : "Choose a program",
		description:
			"Select the training plan whose cycles and calendar you want to manage.",
		items: programs.map((program, index) => {
			const isCurrent = program.id === currentProgramId;
			const goal = program.goalId ? goalsById.get(program.goalId) : null;
			const startDateLabel = formatProgramsPageDate(program.startDate);

			return {
				id: program.id,
				name: program.name,
				badgeLabel: `P${index + 1}`,
				metaLabel: [goal?.name, startDateLabel && `Starts ${startDateLabel}`]
					.filter(Boolean)
					.join(" • "),
				href: `/programs?programId=${program.id}`,
				isCurrent,
				statusLabel: isCurrent ? "Active program" : null,
				accessibleLabel: isCurrent
					? `${program.name}, active program`
					: `Select program ${program.name}`,
			};
		}),
		emptyState: {
			title: "Create your first program",
			description: "Programs organize your training into scheduled cycles and days.",
			icon: "calendar-range",
		},
		createAction: {
			label: "New program",
			accessibleLabel: "Create a new program",
			modalId: "createProgramModal",
			icon: "plus",
		},
	};
}

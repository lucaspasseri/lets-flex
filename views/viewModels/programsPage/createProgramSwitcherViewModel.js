import formatProgramsPageDate from "./formatProgramsPageDate.js";
import formatGoalLabel from "./formatGoalLabel.js";

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
		eyebrow: "Level 1 · Programs",
		heading: programs.length === 0 ? "Create your first program" : "Choose a program",
		description: currentProgramId
			? "Your selected program reveals its cycles and complete training calendar below."
			: "Start here. Choose the overall training plan you want to organize.",
		items: programs.map((program, index) => {
			const isCurrent = program.id === currentProgramId;
			const goal = program.goalId ? goalsById.get(program.goalId) : null;
			const goalLabel = formatGoalLabel(goal?.name);
			const startDateLabel = formatProgramsPageDate(program.startDate);

			return {
				id: program.id,
				name: program.name,
				badgeLabel: `P${index + 1}`,
				metaLabel: [goalLabel, startDateLabel && `Starts ${startDateLabel}`]
					.filter(Boolean)
					.join(" • "),
				href: `/programs?programId=${program.id}`,
				isCurrent,
				statusLabel: isCurrent ? "Selected program" : "Choose program",
				statusIcon: isCurrent ? "check-circle" : "chevron-right",
				accessibleLabel: isCurrent
					? `${program.name}, selected program`
					: `Select program ${program.name}`,
				deleteAction: {
					modalId: "deleteProgramModal",
					accessibleLabel: `Delete program ${program.name}`,
					values: { id: program.id, name: program.name, entity: "program" },
				},
			};
		}),
		emptyState: {
			title: "Create your first program",
			description:
				"A program defines your overall goal and contains every cycle and training day.",
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

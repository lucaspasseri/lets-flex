import formatProgramsPageDate from "./formatProgramsPageDate.js";
import formatGoalLabel from "./formatGoalLabel.js";
import createViewModelTranslator from "../translate.js";

/**
 * @typedef {import("../../../src/features/programs/programs.types.js").Program} Program
 * @typedef {import("../../../src/features/goals/goals.types.js").Goal} Goal
 */

/**
 * @param {{currentProgramId: Program["id"] | null, programs: Program[], goals: Goal[], translate?: Function, language?: string}} input
 */
export default function createProgramSwitcherViewModel({
	currentProgramId,
	programs,
	goals,
	translate,
	language = "en",
}) {
	const t = createViewModelTranslator(translate);
	const goalsById = new Map(goals.map((goal) => [goal.id, goal]));

	return {
		id: "program-switcher",
		listLabel: t("programs.availablePrograms", { defaultValue: "Available programs" }),
		eyebrow: t("programs.levelPrograms", { defaultValue: "Level 1 · Programs" }),
		heading:
			programs.length === 0
				? t("programs.createFirstProgram", {
						defaultValue: "Create your first program",
					})
				: t("programs.chooseProgram", { defaultValue: "Choose a program" }),
		description: currentProgramId
			? t("programs.selectedProgramDescription", {
					defaultValue:
						"Your selected program reveals its cycles and complete training calendar below.",
				})
			: t("programs.chooseProgramDescription", {
					defaultValue:
						"Start here. Choose the overall training plan you want to organize.",
				}),
		items: programs.map((program, index) => {
			const isCurrent = program.id === currentProgramId;
			const goal = program.goalId ? goalsById.get(program.goalId) : null;
			const goalLabel = formatGoalLabel(goal?.name);
			const startDateLabel = formatProgramsPageDate(program.startDate, language);

			return {
				id: program.id,
				name: program.name,
				badgeLabel: `P${index + 1}`,
				metaLabel: [
					goalLabel,
					startDateLabel &&
						t("programs.startsDate", {
							date: startDateLabel,
							defaultValue: "Starts {{date}}",
						}),
				]
					.filter(Boolean)
					.join(" • "),
				href: `/programs?programId=${program.id}`,
				isCurrent,
				statusLabel: isCurrent
					? t("programs.selectedProgramStatus", { defaultValue: "Selected program" })
					: t("programs.chooseProgramStatus", { defaultValue: "Choose program" }),
				statusIcon: isCurrent ? "check-circle" : "chevron-right",
				accessibleLabel: isCurrent
					? t("programs.selectedProgram", {
							name: program.name,
							defaultValue: "{{name}}, selected program",
						})
					: t("programs.selectProgram", {
							name: program.name,
							defaultValue: "Select program {{name}}",
						}),
				deleteAction: {
					modalId: "deleteProgramModal",
					accessibleLabel: t("programs.deleteProgram", {
						name: program.name,
						defaultValue: "Delete program {{name}}",
					}),
					values: { id: program.id, name: program.name, entity: "program" },
				},
			};
		}),
		emptyState: {
			title: t("programs.createFirstProgram", {
				defaultValue: "Create your first program",
			}),
			description: t("programs.createProgramDescription", {
				defaultValue:
					"A program defines your overall goal and contains every cycle and training day.",
			}),
			icon: "calendar-range",
		},
		createAction: {
			label: t("programs.newProgram", { defaultValue: "New program" }),
			accessibleLabel: t("programs.createNewProgram", {
				defaultValue: "Create a new program",
			}),
			modalId: "createProgramModal",
			icon: "plus",
		},
	};
}

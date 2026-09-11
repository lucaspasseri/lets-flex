import createDayNavigationViewModel from "./createDayNavigationViewModel.js";
import createSessionLinkFormViewModel from "./createSessionLinkFormViewModel.js";
import createWorkoutSessionListViewModel from "./createWorkoutSessionListViewModel.js";
import formatDayPageDate from "./formatDayPageDate.js";
import createDayViewTransitionName from "../shared/createDayViewTransitionName.js";

/**
 * @typedef {import("../../../src/features/day/dayPage.types.js").CreateDayPageViewModelInput} CreateDayPageViewModelInput
 * @param {CreateDayPageViewModelInput} input
 */
export default function createDayPageViewModel({
	page,
	pageState,
	data,
	sessionLinkFormState,
	workoutFeedback,
}) {
	const { currentUser, program, cycle, days, sessions, workoutSessions } = data;
	const currentDayId = days.current?.id ?? null;
	const dayTitle =
		days.current?.label?.trim() ||
		(days.current ? `Day ${days.current.dayOrder}` : "Training day unavailable");
	const dayEyebrow =
		program && cycle ? `${program.name} · ${cycle.name}` : "Training day";
	const workoutSessionList = createWorkoutSessionListViewModel({
		currentDayId,
		workoutSessions: workoutSessions.items,
	});
	const programsHref =
		program && cycle
			? `/programs?programId=${program.id}&cycleId=${cycle.id}`
			: "/programs";

	return {
		page: {
			...page,
			title: days.current
				? `${dayTitle} · ${cycle?.name ?? "Training day"} · Let's Flex!`
				: "Training day unavailable · Let's Flex!",
		},
		pageState: { ...pageState, dayId: currentDayId },
		shell: { currentUser, activeNavigation: "programs" },
		components: {
			workoutFeedback: workoutFeedback ?? null,
			contextPath: {
				isVisible: Boolean(program && cycle && days.current),
				backHref: programsHref,
				programName: program?.name ?? null,
				cycleName: cycle?.name ?? null,
				dayName: dayTitle,
			},
			dayHeader: {
				dayId: currentDayId,
				viewTransitionName: createDayViewTransitionName(currentDayId),
				eyebrow: dayEyebrow,
				title: dayTitle,
				dateLabel:
					formatDayPageDate(days.current?.scheduledDate ?? null) ??
					"Date not scheduled",
				statusLabel:
					currentDayId === null
						? "Day unavailable"
						: workoutSessionList.count === 0
							? "Needs a session"
							: workoutSessionList.count === 1
								? "1 session assigned"
								: `${workoutSessionList.count} sessions assigned`,
				intro: days.current
					? "Choose a reusable template, assign it to this day, then manage the planned workout below."
					: "Return to Programs and choose a training day that belongs to your plan.",
			},
			dayNavigation: createDayNavigationViewModel({
				currentDay: days.current,
				days: days.items,
				programName: program?.name ?? null,
				cycleName: cycle?.name ?? null,
			}),
			sessionLinkForm: createSessionLinkFormViewModel({
				currentDayId,
				sessions: sessions.items,
				state: sessionLinkFormState,
				selectedSessionId: pageState.sessionId,
			}),
			workoutSessionList,
		},
	};
}

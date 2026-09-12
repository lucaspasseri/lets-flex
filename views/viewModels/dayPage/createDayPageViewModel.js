import createDayNavigationViewModel from "./createDayNavigationViewModel.js";
import createSessionLinkFormViewModel from "./createSessionLinkFormViewModel.js";
import createWorkoutSessionListViewModel from "./createWorkoutSessionListViewModel.js";
import formatDayPageDate from "./formatDayPageDate.js";
import createDayViewTransitionName from "../shared/createDayViewTransitionName.js";
import createViewModelTranslator from "../translate.js";

/**
 * @typedef {import("../../../src/features/day/dayPage.types.js").CreateDayPageViewModelInput} CreateDayPageViewModelInput
 * @param {CreateDayPageViewModelInput & {translate?: Function}} input
 */
export default function createDayPageViewModel({
	page,
	pageState,
	data,
	sessionLinkFormState,
	workoutFeedback,
	translate,
}) {
	const t = createViewModelTranslator(translate);
	const { currentUser, program, cycle, days, sessions, workoutSessions } = data;
	const currentDayId = days.current?.id ?? null;
	const dayTitle =
		days.current?.label?.trim() ||
		(days.current
			? `Day ${days.current.dayOrder}`
			: t("dashboard.dayUnavailable", { defaultValue: "Training day unavailable" }));
	const dayEyebrow =
		program && cycle
			? `${program.name} · ${cycle.name}`
			: t("dashboard.trainingDay", { defaultValue: "Training day" });
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
				? `${dayTitle} · ${cycle?.name ?? t("dashboard.trainingDay", { defaultValue: "Training day" })} · Let's Flex!`
				: `${t("dashboard.dayUnavailable", { defaultValue: "Training day unavailable" })} · Let's Flex!`,
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
					t("dashboard.dateNotScheduled", { defaultValue: "Date not scheduled" }),
				statusLabel:
					currentDayId === null
						? t("dashboard.dayUnavailable", { defaultValue: "Day unavailable" })
						: workoutSessionList.count === 0
							? t("dashboard.needsSession", { defaultValue: "Needs a session" })
							: workoutSessionList.count === 1
								? "1 session assigned"
								: `${workoutSessionList.count} sessions assigned`,
				intro: days.current
					? t("dashboard.dayIntro", {
							defaultValue:
								"Choose a reusable template, assign it to this day, then manage the planned workout below.",
						})
					: t("dashboard.unavailableDayIntro", {
							defaultValue:
								"Return to Programs and choose a training day that belongs to your plan.",
						}),
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

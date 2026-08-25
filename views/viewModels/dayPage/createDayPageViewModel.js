import createDayNavigationViewModel from "./createDayNavigationViewModel.js";
import createSessionLinkFormViewModel from "./createSessionLinkFormViewModel.js";
import createWorkoutSessionListViewModel from "./createWorkoutSessionListViewModel.js";
import formatDayPageDate from "./formatDayPageDate.js";

/**
 * @typedef {import("../../../src/features/day/dayPage.types.js").CreateDayPageViewModelInput} CreateDayPageViewModelInput
 * @param {CreateDayPageViewModelInput} input
 */
export default function createDayPageViewModel({ page, pageState, data }) {
	const { currentUser, days, sessions, workoutSessions } = data;
	const currentDayId = days.current?.id ?? null;

	return {
		page,
		pageState: { ...pageState, dayId: currentDayId },
		shell: { currentUser, activeNavigation: "programs" },
		components: {
			dayHeader: {
				dayId: currentDayId,
				dateLabel:
					formatDayPageDate(days.current?.scheduledDate ?? null) ??
					"Date outside the program's boundaries",
			},
			dayNavigation: createDayNavigationViewModel({
				currentDay: days.current,
				days: days.items,
			}),
			sessionLinkForm: createSessionLinkFormViewModel({
				currentDayId,
				sessions: sessions.items,
			}),
			workoutSessionList: createWorkoutSessionListViewModel({
				currentDayId,
				workoutSessions: workoutSessions.items,
			}),
		},
	};
}

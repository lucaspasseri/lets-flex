import { addDays, format, isSameDay } from "date-fns";
import createSessionStatusMarkersViewModel from "../shared/createSessionStatusMarkersViewModel.js";

/** @param {Pick<import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData, "selectedDate" | "scheduledWorkoutSessions"> & {daysDifference: number | null}} input */
export default function createDateNavigationViewModel({
	selectedDate,
	daysDifference,
	scheduledWorkoutSessions,
}) {
	const offset = daysDifference ?? 0;
	return {
		previousHref: `/?daysDifference=${offset - 1}`,
		nextHref: `/?daysDifference=${offset + 1}`,
		days: Array.from({ length: 7 }, (_, index) => {
			const date = addDays(selectedDate, index - 3);
			return {
				date,
				weekdayLabel: format(date, "EEE").toUpperCase(),
				dayLabel: format(date, "dd"),
				isActive: index === 3,
				statusMarkers: createSessionStatusMarkersViewModel(
					scheduledWorkoutSessions.filter(
						(session) =>
							session.scheduledDate && isSameDay(session.scheduledDate, date),
					),
				),
			};
		}),
	};
}

import { addDays, isSameDay } from "date-fns";
import createSessionStatusMarkersViewModel from "../shared/createSessionStatusMarkersViewModel.js";

/** @param {Pick<import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData, "selectedDate" | "scheduledWorkoutSessions"> & {daysDifference: number | null, translate?: Function, language?: string}} input */
export default function createDateNavigationViewModel({
	selectedDate,
	daysDifference,
	scheduledWorkoutSessions,
	translate,
	language = "en",
}) {
	const offset = daysDifference ?? 0;
	const weekdayFormatter = new Intl.DateTimeFormat(language, {
		weekday: "short",
		timeZone: "UTC",
	});
	const dayFormatter = new Intl.DateTimeFormat(language, {
		day: "2-digit",
		timeZone: "UTC",
	});
	return {
		previousHref: `/?daysDifference=${offset - 1}`,
		nextHref: `/?daysDifference=${offset + 1}`,
		days: Array.from({ length: 7 }, (_, index) => {
			const date = addDays(selectedDate, index - 3);
			return {
				date,
				weekdayLabel: weekdayFormatter.format(date).toUpperCase(),
				dayLabel: dayFormatter.format(date),
				isActive: index === 3,
				statusMarkers: createSessionStatusMarkersViewModel(
					scheduledWorkoutSessions.filter(
						(session) =>
							session.scheduledDate && isSameDay(session.scheduledDate, date),
					),
					translate,
				),
			};
		}),
	};
}

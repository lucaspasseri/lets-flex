import { addDays } from "date-fns";

/** @param {Pick<import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData, "currentUser" | "currentProgram" | "selectedDate">} input */

export default function createDashboardStatusViewModel(
	{ currentUser, currentProgram, selectedDate },
	language = "en",
) {
	const dateFormatter = new Intl.DateTimeFormat(language, {
		month: "short",
		day: "2-digit",
		year: "numeric",
		timeZone: "UTC",
	});
	const weekdayFormatter = new Intl.DateTimeFormat(language, {
		weekday: "short",
		timeZone: "UTC",
	});
	const dayFormatter = new Intl.DateTimeFormat(language, {
		day: "2-digit",
		timeZone: "UTC",
	});
	return {
		isVisible: !currentUser || !currentProgram,
		dateLabel: dateFormatter.format(selectedDate),
		days: Array.from({ length: 7 }, (_, index) => {
			const date = addDays(selectedDate, index - 3);
			return {
				label: weekdayFormatter.format(date).toUpperCase(),
				dayLabel: dayFormatter.format(date),
				isCurrent: index === 3,
			};
		}),
		userEmptyState: { isVisible: !currentUser, href: "/profile" },
		programEmptyState: { isVisible: !currentProgram, href: "/programs" },
	};
}

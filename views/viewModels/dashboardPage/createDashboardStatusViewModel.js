import { addDays, format } from "date-fns";

/** @param {Pick<import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData, "currentUser" | "currentProgram" | "selectedDate">} input */
export default function createDashboardStatusViewModel({
	currentUser,
	currentProgram,
	selectedDate,
}) {
	return {
		isVisible: !currentUser || !currentProgram,
		dateLabel: format(selectedDate, "MMM dd, yyyy"),
		days: Array.from({ length: 7 }, (_, index) => {
			const date = addDays(selectedDate, index - 3);
			return {
				label: format(date, "EEE").toUpperCase(),
				dayLabel: format(date, "dd"),
				isCurrent: index === 3,
			};
		}),
		userEmptyState: { isVisible: !currentUser, href: "/profile" },
		programEmptyState: { isVisible: !currentProgram, href: "/programs" },
	};
}

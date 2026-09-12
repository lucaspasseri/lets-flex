import { addDays } from "date-fns";
import { formatLocaleDate } from "../../../src/infrastructure/i18n/formatLocale.js";

/** @param {Pick<import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData, "currentUser" | "currentProgram" | "selectedDate">} input */

export default function createDashboardStatusViewModel(
	{ currentUser, currentProgram, selectedDate },
	language = "en",
) {
	/** @type {Intl.DateTimeFormatOptions} */
	const dateOptions = {
		month: "short",
		day: "2-digit",
		year: "numeric",
	};
	/** @type {Intl.DateTimeFormatOptions} */
	const weekdayOptions = {
		weekday: "short",
	};
	/** @type {Intl.DateTimeFormatOptions} */
	const dayOptions = {
		day: "2-digit",
	};
	return {
		isVisible: !currentUser || !currentProgram,
		dateLabel: formatLocaleDate(selectedDate, language, dateOptions) ?? "",
		days: Array.from({ length: 7 }, (_, index) => {
			const date = addDays(selectedDate, index - 3);
			return {
				label: formatLocaleDate(date, language, weekdayOptions)?.toUpperCase(),
				dayLabel: formatLocaleDate(date, language, dayOptions) ?? "",
				isCurrent: index === 3,
			};
		}),
		userEmptyState: { isVisible: !currentUser, href: "/profile" },
		programEmptyState: { isVisible: !currentProgram, href: "/programs" },
	};
}

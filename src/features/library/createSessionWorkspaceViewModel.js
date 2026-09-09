import createSummary from "./createSummaryViewModel.js";
import createDetails from "./createDetailsViewModel.js";
import createDiscoveryFilterOptions from "./createDiscoveryFilterOptions.js";

/**
 * @typedef {import("../sessions/sessions.types.js").SessionMapper} SessionMapper
 * @typedef {import("../sessions/sessions.types.js").SessionWorkspaceViewModel} SessionWorkspaceViewModel
 */

/**
 * @typedef {object} CreateSessionWorkspaceInput
 * @property {SessionMapper[]} sessionArr
 * @property {SessionMapper | null} activeSession
 * @property {number | null} actorUserId
 */

/**
 * @param {CreateSessionWorkspaceInput} input
 * @returns {SessionWorkspaceViewModel}
 */

function createSessionWorkspace({
	sessionArr = [],
	activeSession,
	actorUserId = null,
}) {
	const summaryArr = sessionArr.map((session) =>
		createSummary({ session, activeSessionId: activeSession?.id ?? null }),
	);

	const details = createDetails({ session: activeSession, actorUserId });
	const filterDefinitions = [
		{
			name: "movement",
			label: "Movement pattern",
			allLabel: "All movements",
			level: /** @type {const} */ ("base"),
			options: createDiscoveryFilterOptions(
				summaryArr.flatMap((summary) => summary.filters.movement),
			),
		},
		{
			name: "muscle",
			label: "Muscle",
			allLabel: "All muscles",
			level: /** @type {const} */ ("base"),
			options: createDiscoveryFilterOptions(
				summaryArr.flatMap((summary) => summary.filters.muscle),
			),
		},
		{
			name: "equipment",
			label: "Equipment",
			allLabel: "All equipment",
			level: /** @type {const} */ ("base"),
			options: createDiscoveryFilterOptions(
				summaryArr.flatMap((summary) => summary.filters.equipment),
			),
		},
	].filter((filter) => filter.options.length > 1);

	return {
		id: "session-workspace",
		heading: "Session templates",

		createAction: {
			label: "Create session",
			modalId: "createSessionModal",
			icon: "plus",
		},

		discovery: {
			id: "session-discovery",
			title: "Find a session",
			description:
				"Search the session name, notes, exercises, or variants, then narrow by training metadata.",
			searchLabel: "Search sessions",
			searchPlaceholder: "Search sessions, exercises, or notes",
			filters: filterDefinitions,
		},

		summaries: {
			id: "session-summaries",
			heading: "Sessions",
			emptyState: {
				message: "No session templates have been created yet.",
				icon: "list-ordered",
			},

			items: summaryArr,
		},

		details,
	};
}

export default createSessionWorkspace;

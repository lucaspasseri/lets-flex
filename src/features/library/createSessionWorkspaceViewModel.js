import createSummary from "./createSummaryViewModel.js";
import createDetails from "./createDetailsViewModel.js";

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

	return {
		id: "session-workspace",
		heading: "Session templates",

		createAction: {
			label: "Create session",
			modalId: "createSessionModal",
			icon: "plus",
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

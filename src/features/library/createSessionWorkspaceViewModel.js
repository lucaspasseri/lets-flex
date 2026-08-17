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
 */

/**
 * @param {CreateSessionWorkspaceInput} input
 * @returns {SessionWorkspaceViewModel}
 */

function createSessionWorkspace({ sessionArr = [], activeSession }) {
	const summaryArr = sessionArr.map(session =>
		createSummary({ session, activeSessionId: activeSession?.id ?? null }),
	);

	const details = createDetails({ session: activeSession });

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
			emptyMessage: "No session templates have been created yet.",

			items: summaryArr,
		},

		details,
	};
}

export default createSessionWorkspace;

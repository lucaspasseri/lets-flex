import createSummary from "./createSummaryViewModel.js";
import createDetails from "./createDetailsViewModel.js";

function createSessionWorkspace({ sessionArr = [], activeSession = {} }) {
	const summaryArr = sessionArr.map(session =>
		createSummary({ session, activeSessionId: activeSession.id }),
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

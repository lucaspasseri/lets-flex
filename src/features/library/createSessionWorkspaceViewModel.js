import createSummary from "./createSummaryViewModel.js";
import createDetails from "./createDetailsViewModel.js";
import createDiscoveryFilterOptions from "./createDiscoveryFilterOptions.js";
import translateCount from "../../infrastructure/i18n/translateCount.js";
import translateMessage from "../../infrastructure/i18n/translateMessage.js";

/**
 * @typedef {import("../sessions/sessions.types.js").SessionMapper} SessionMapper
 * @typedef {import("../sessions/sessions.types.js").SessionWorkspaceViewModel} SessionWorkspaceViewModel
 */

/**
 * @typedef {object} CreateSessionWorkspaceInput
 * @property {SessionMapper[]} sessionArr
 * @property {SessionMapper | null} activeSession
 * @property {number | null} actorUserId
 * @property {string} [language]
 * @property {Function} [translate]
 */

/**
 * @param {CreateSessionWorkspaceInput} input
 * @returns {SessionWorkspaceViewModel}
 */

function createSessionWorkspace({
	sessionArr = [],
	activeSession,
	actorUserId = null,
	language = "en",
	translate,
}) {
	const t = (key, options = {}) =>
		translateMessage(translate, key, String(options.defaultValue ?? ""), options);
	const summaryArr = sessionArr.map((session) =>
		createSummary({
			session,
			activeSessionId: activeSession?.id ?? null,
			translate,
		}),
	);

	const details = createDetails({
		session: activeSession,
		actorUserId,
		language,
		translate,
	});
	const filterDefinitions = [
		{
			name: "movement",
			label: t("library.movementPattern", { defaultValue: "Movement pattern" }),
			allLabel: t("library.allMovements", { defaultValue: "All movements" }),
			level: /** @type {const} */ ("base"),
			options: createDiscoveryFilterOptions(
				summaryArr.flatMap((summary) => summary.filters.movement),
			),
		},
		{
			name: "muscle",
			label: t("library.muscle", { defaultValue: "Muscle" }),
			allLabel: t("library.allMuscles", { defaultValue: "All muscles" }),
			level: /** @type {const} */ ("base"),
			options: createDiscoveryFilterOptions(
				summaryArr.flatMap((summary) => summary.filters.muscle),
			),
		},
		{
			name: "equipment",
			label: t("library.equipment", { defaultValue: "Equipment" }),
			allLabel: t("library.allEquipment", { defaultValue: "All equipment" }),
			level: /** @type {const} */ ("base"),
			options: createDiscoveryFilterOptions(
				summaryArr.flatMap((summary) => summary.filters.equipment),
			),
		},
	].filter((filter) => filter.options.length > 1);

	return {
		id: "session-workspace",
		heading: t("library.sessionTemplates", { defaultValue: "Session templates" }),

		createAction: {
			label: t("library.createSession", { defaultValue: "Create session" }),
			modalId: "createSessionModal",
			icon: "plus",
		},

		discovery: {
			id: "session-discovery",
			title: t("library.findSession", { defaultValue: "Find a session" }),
			description: t("library.findSessionDescription", {
				defaultValue:
					"Search the session name, notes, exercises, or variants, then narrow by training metadata.",
			}),
			searchLabel: t("library.searchSessions", { defaultValue: "Search sessions" }),
			searchPlaceholder: t("library.searchSessionsPlaceholder", {
				defaultValue: "Search sessions, exercises, or notes",
			}),
			filters: filterDefinitions,
		},

		summaries: {
			id: "session-summaries",
			heading: t("library.sessions", { defaultValue: "Sessions" }),
			countLabel: translateCount(translate, "library.sessionCount", summaryArr.length, {
				one: "{{count}} session",
				other: "{{count}} sessions",
			}),
			emptyState: {
				message: t("library.noSessionTemplates", {
					defaultValue: "No session templates have been created yet.",
				}),
				icon: "list-ordered",
			},

			items: summaryArr,
		},

		details,
	};
}

export default createSessionWorkspace;

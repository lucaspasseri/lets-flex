/**
 * @typedef {import("../features/users/users.types.js").User} User
 * @typedef {import("../features/sessions/sessions.types.js").SessionRow} SessionRow
 */

/**
 * @typedef {object} LocalsPage
 * @property {string} path
 * @property {string} url
 * @property {string} backUrl
 * @property {string} backUrlWithoutParams
 * @property {string} title
 */

/**
 * @typedef {object} LocalsLibraryPageState
 * @property {User["id"] | null} userId
 * @property {SessionRow["id"] | null} sessionId
 */

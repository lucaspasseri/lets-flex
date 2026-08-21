import toNullableNumber from "../../../utils/toNullableNumber.js";

/**
 * @typedef {import("../users/users.types.js").User} User
 */

/**
 * @param {{query: Record<string, unknown>, sessionState: {userId?: unknown}}} input
 * @returns {User["id"] | null}
 */
function resolveActiveUserId({ query, sessionState }) {
	const queryUserId = toNullableNumber(query?.userId);
	const sessionUserId = toNullableNumber(sessionState?.userId);

	return queryUserId ?? sessionUserId ?? null;
}

export default resolveActiveUserId;

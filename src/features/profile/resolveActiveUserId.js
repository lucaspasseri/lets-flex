import toNullableNumber from "../../../utils/toNullableNumber.js";

function resolveActiveUserId({ query, sessionState }) {
	const queryUserId = toNullableNumber(query?.userId);
	const sessionUserId = toNullableNumber(sessionState?.userId);

	return queryUserId ?? sessionUserId ?? null;
}

export default resolveActiveUserId;

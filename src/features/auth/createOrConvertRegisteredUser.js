import { format } from "date-fns";
import * as usersRepository from "../users/repository.js";
import createStarterWorkspace from "../guests/createStarterWorkspace.js";

export class GuestConversionUnavailableError extends Error {
	constructor() {
		super("The guest workspace is no longer available for conversion.");
		this.name = "GuestConversionUnavailableError";
	}
}

/**
 * Creates a registered principal or converts the active guest in place.
 * The caller owns the transaction that also attaches an authentication identity.
 * @param {{email: string, name: string, guestUserId?: number | null, sessionState?: Record<string, unknown>}} input
 * @param {import("pg").PoolClient} db
 */
export default async function createOrConvertRegisteredUser(
	{ email, name, guestUserId = null, sessionState = {} },
	db,
) {
	const user =
		guestUserId !== null
			? await usersRepository.convertActiveGuest(
					{ userId: guestUserId, email, name },
					db,
				)
			: await usersRepository.createRegisteredUser({ email, name }, db);

	if (!user) throw new GuestConversionUnavailableError();

	const starterSessionState =
		guestUserId === null
			? toSessionState(
					await createStarterWorkspace(
						{ userId: user.id, scheduledDate: format(new Date(), "yyyy-MM-dd") },
						db,
					),
				)
			: toSessionState(sessionState);

	return Object.assign(user, { starterSessionState });
}

/** @param {any} starter */
function toSessionState(starter) {
	const dayId = starter?.dayId ?? starter?.trainingDayId;
	if (
		!Number.isInteger(starter?.programId) ||
		!Number.isInteger(starter?.cycleId) ||
		!Number.isInteger(dayId)
	) {
		return null;
	}

	return {
		programId: starter.programId,
		cycleId: starter.cycleId,
		dayId,
	};
}

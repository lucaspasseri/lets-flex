import * as usersRepository from "../users/repository.js";

export class GuestConversionUnavailableError extends Error {
	constructor() {
		super("The guest workspace is no longer available for conversion.");
		this.name = "GuestConversionUnavailableError";
	}
}

/**
 * Creates a registered principal or converts the active guest in place.
 * The caller owns the transaction that also attaches an authentication identity.
 * @param {{email: string, name: string, guestUserId?: number | null}} input
 * @param {import("pg").PoolClient} db
 */
export default async function createOrConvertRegisteredUser(
	{ email, name, guestUserId = null },
	db,
) {
	const user = guestUserId
		? await usersRepository.convertActiveGuest({ userId: guestUserId, email, name }, db)
		: await usersRepository.createRegisteredUser({ email, name }, db);

	if (!user) throw new GuestConversionUnavailableError();
	return user;
}

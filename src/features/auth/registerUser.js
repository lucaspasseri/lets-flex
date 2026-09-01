import pool from "../../../db/pool.js";
import * as authIdentitiesRepository from "./authIdentitiesRepository.js";
import { hashPassword } from "./passwordService.js";
import * as usersRepository from "../users/repository.js";

export class GuestConversionUnavailableError extends Error {
	constructor() {
		super("The guest workspace is no longer available for conversion.");
		this.name = "GuestConversionUnavailableError";
	}
}

/** @param {{email: string, password: string, guestUserId?: number | null}} input */
export default async function registerUser({ email, password, guestUserId = null }) {
	const passwordHash = await hashPassword(password);
	const name = email.slice(0, email.lastIndexOf("@"));
	const client = await pool.connect();

	try {
		await client.query("BEGIN");
		const user = guestUserId
			? await usersRepository.convertActiveGuest(
					{ userId: guestUserId, email, name },
					client,
				)
			: await usersRepository.createRegisteredUser({ email, name }, client);

		if (!user) throw new GuestConversionUnavailableError();
		await authIdentitiesRepository.createLocal(
			{ userId: user.id, email, passwordHash },
			client,
		);
		await client.query("COMMIT");
		return user;
	} catch (error) {
		await client.query("ROLLBACK").catch(() => {});
		throw error;
	} finally {
		client.release();
	}
}

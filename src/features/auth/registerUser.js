import pool from "../../../db/pool.js";
import * as authIdentitiesRepository from "./authIdentitiesRepository.js";
import createOrConvertRegisteredUser from "./createOrConvertRegisteredUser.js";
import { hashPassword } from "./passwordService.js";

/** @param {{email: string, password: string, guestUserId?: number | null}} input */
export default async function registerUser({ email, password, guestUserId = null }) {
	const passwordHash = await hashPassword(password);
	const name = email.slice(0, email.lastIndexOf("@"));
	const client = await pool.connect();

	try {
		await client.query("BEGIN");
		const user = await createOrConvertRegisteredUser(
			{ email, name, guestUserId },
			client,
		);
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

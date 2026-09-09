import pool from "../../../db/pool.js";
import * as usersRepository from "../users/repository.js";
import * as authIdentitiesRepository from "./authIdentitiesRepository.js";
import { hashPassword } from "./passwordService.js";

export class LocalIdentityAlreadyExistsError extends Error {
	constructor() {
		super("A password is already set for this account.");
		this.name = "LocalIdentityAlreadyExistsError";
	}
}

/** @param {{userId: number, password: string}} input */
export default async function addPasswordIdentity({ userId, password }) {
	const passwordHash = await hashPassword(password);
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		const user = await usersRepository.findPrincipalByIdForUpdate({ userId }, client);
		if (!user || user.role === "guest" || !user.is_active || !user.email) {
			throw new Error("The account is not available for password authentication.");
		}
		const identities = await authIdentitiesRepository.findByUserId({ userId }, client);
		if (identities.some((identity) => identity.provider === "local")) {
			throw new LocalIdentityAlreadyExistsError();
		}
		await authIdentitiesRepository.createLocal(
			{ userId, email: user.email, passwordHash },
			client,
		);
		await client.query("COMMIT");
		return user;
	} catch (error) {
		await client.query("ROLLBACK").catch(() => {});
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "23505"
		) {
			throw new LocalIdentityAlreadyExistsError();
		}
		throw error;
	} finally {
		client.release();
	}
}

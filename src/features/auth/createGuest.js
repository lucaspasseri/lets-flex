import { randomUUID } from "node:crypto";
import { format } from "date-fns";
import pool from "../../../db/pool.js";
import * as usersRepository from "../users/repository.js";
import createStarterWorkspace from "../guests/createStarterWorkspace.js";

export const GUEST_TTL_DAYS = 15;

const defaultDependencies = {
	pool,
	usersRepository,
};

/**
 * Creates the temporary principal and its starter training hierarchy atomically.
 *
 * @param {{now?: Date, ttlDays?: number}} [input]
 * @param {any} [dependencies]
 */
export default async function createGuest(
	{
		now = new Date(),
		ttlDays = Number(process.env.GUEST_TTL_DAYS || GUEST_TTL_DAYS),
	} = {},
	dependencies = defaultDependencies,
) {
	if (!Number.isInteger(ttlDays) || ttlDays <= 0) {
		throw new Error("GUEST_TTL_DAYS must be a positive integer");
	}

	const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);
	const scheduledDate = format(now, "yyyy-MM-dd");
	const suffix = randomUUID().slice(0, 8);
	const client = await dependencies.pool.connect();

	try {
		await client.query("BEGIN");

		const guest = await dependencies.usersRepository.createGuest(
			{
				name: `Guest ${suffix}`,
				expiresAt,
			},
			client,
		);
		if (!guest) throw new Error("Guest account could not be created");

		const starter = await createStarterWorkspace(
			{ userId: guest.id, scheduledDate },
			client,
			dependencies,
		);

		await client.query("COMMIT");

		return {
			user: guest,
			starter,
		};
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

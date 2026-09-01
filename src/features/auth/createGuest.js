import { randomUUID } from "node:crypto";
import * as usersRepository from "../users/repository.js";

export const GUEST_TTL_DAYS = 15;

/** @param {{now?: Date, ttlDays?: number}} [input] */
export default async function createGuest({
	now = new Date(),
	ttlDays = Number(process.env.GUEST_TTL_DAYS || GUEST_TTL_DAYS),
} = {}) {
	if (!Number.isInteger(ttlDays) || ttlDays <= 0) {
		throw new Error("GUEST_TTL_DAYS must be a positive integer");
	}

	const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);
	const suffix = randomUUID().slice(0, 8);
	const guest = await usersRepository.createGuest({
		name: `Guest ${suffix}`,
		expiresAt,
	});
	if (!guest) throw new Error("Guest account could not be created");
	return guest;
}

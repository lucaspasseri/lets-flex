import pool from "../../../db/pool.js";

/**
 * @typedef {import("./users.types.js").FindUserInput} FindUserInput
 * @typedef {import("./users.types.js").UserRow} UserRow
 */

/**
 * @returns {Promise<UserRow[]>}
 */

/**
 * @param {FindUserInput} input
 * @returns {Promise<UserRow | null>}
 */

export async function findById({ userId }, db = pool) {
	const { rows } = await db.query(
		"SELECT id, email, role, name, date_of_birth, anamnesis, is_active, guest_expires_at FROM users WHERE id = $1",
		[userId],
	);

	return rows[0] ?? null;
}

/** @param {{userId: number}} input @param {any} db */
export async function findPrincipalById({ userId }, db = pool) {
	const { rows } = await db.query(
		`SELECT id, email, role, name, is_active, guest_expires_at
		 FROM users WHERE id = $1`,
		[userId],
	);
	return rows[0] ?? null;
}

/** @param {{userId: number}} input @param {any} db */
export async function findPrincipalByIdForUpdate({ userId }, db) {
	const { rows } = await db.query(
		`SELECT id, email, role, name, is_active, guest_expires_at
		 FROM users WHERE id = $1 FOR UPDATE`,
		[userId],
	);
	return rows[0] ?? null;
}

/** @param {{name: string, expiresAt: Date}} input @param {any} db */
export async function createGuest({ name, expiresAt }, db = pool) {
	const { rows } = await db.query(
		`INSERT INTO users (name, role, guest_expires_at)
		 VALUES ($1, 'guest', $2)
		 RETURNING id, email, role, name, is_active, guest_expires_at`,
		[name, expiresAt],
	);
	return rows[0] ?? null;
}

/** @param {{email: string, name: string}} input @param {any} db */
export async function createRegisteredUser({ email, name }, db = pool) {
	const { rows } = await db.query(
		`INSERT INTO users (email, name, role)
		 VALUES ($1, $2, 'user')
		 RETURNING id, email, role, name, is_active, guest_expires_at`,
		[email, name],
	);
	return rows[0];
}

/** @param {{userId: number, email: string, name: string}} input @param {any} db */
export async function convertActiveGuest({ userId, email, name }, db = pool) {
	const { rows } = await db.query(
		`UPDATE users
		 SET email = $2, name = $3, role = 'user', guest_expires_at = NULL,
		     updated_at = NOW()
		 WHERE id = $1 AND role = 'guest' AND is_active = TRUE
		   AND guest_expires_at > NOW()
		 RETURNING id, email, role, name, is_active, guest_expires_at`,
		[userId, email, name],
	);
	return rows[0] ?? null;
}

/** @param {{userId: number}} input @param {any} db */
export async function deleteGuestById({ userId }, db = pool) {
	await db.query("DELETE FROM users WHERE id = $1 AND role = 'guest'", [userId]);
}

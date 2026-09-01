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

/** @param {{email: string}} input @param {any} db */
export async function findForAuthenticationByEmail({ email }, db = pool) {
	const { rows } = await db.query(
		`SELECT id, email, password_hash, role, name, is_active, guest_expires_at
		 FROM users WHERE email = $1`,
		[email],
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

/** @param {{email: string, passwordHash: string, name: string}} input @param {any} db */
export async function createRegisteredUser({ email, passwordHash, name }, db = pool) {
	const { rows } = await db.query(
		`INSERT INTO users (email, password_hash, name, role)
		 VALUES ($1, $2, $3, 'user')
		 RETURNING id, email, role, name, is_active, guest_expires_at`,
		[email, passwordHash, name],
	);
	return rows[0];
}

/** @param {{userId: number}} input @param {any} db */
export async function deleteGuestById({ userId }, db = pool) {
	await db.query("DELETE FROM users WHERE id = $1 AND role = 'guest'", [userId]);
}

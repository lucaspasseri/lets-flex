import pool from "../../../db/pool.js";

/** @typedef {import("./auth.types.js").AuthIdentityRow} AuthIdentityRow */

/**
 * Finds the application principal and local credential used by Passport.
 * The local subject is the normalized email entered at registration.
 * @param {{email: string}} input
 * @param {import("pg").Pool | import("pg").PoolClient} [db]
 */
export async function findLocalByEmail({ email }, db = pool) {
	const { rows } = await db.query(
		`SELECT u.id, u.email, u.role, u.name, u.is_active, u.guest_expires_at,
		        ai.password_hash
		 FROM auth_identities ai
		 JOIN users u ON u.id = ai.user_id
		 WHERE ai.provider = 'local' AND ai.provider_subject = $1`,
		[email],
	);
	return rows[0] ?? null;
}

/**
 * Resolves an application principal strictly from a provider's stable subject.
 * It intentionally does not match or merge users by email.
 * @param {{provider: string, providerSubject: string}} input
 * @param {import("pg").Pool | import("pg").PoolClient} [db]
 */
export async function findPrincipalByProviderSubject(
	{ provider, providerSubject },
	db = pool,
) {
	const { rows } = await db.query(
		`SELECT u.id, u.email, u.role, u.name, u.is_active, u.guest_expires_at
		 FROM auth_identities ai
		 JOIN users u ON u.id = ai.user_id
		 WHERE ai.provider = $1 AND ai.provider_subject = $2`,
		[provider, providerSubject],
	);
	return rows[0] ?? null;
}

/**
 * @param {{userId: number, email: string, passwordHash: string}} input
 * @param {import("pg").Pool | import("pg").PoolClient} [db]
 * @returns {Promise<AuthIdentityRow>}
 */
export async function createLocal({ userId, email, passwordHash }, db = pool) {
	const { rows } = await db.query(
		`INSERT INTO auth_identities
		 (user_id, provider, provider_subject, password_hash)
		 VALUES ($1, 'local', $2, $3)
		 RETURNING id, user_id, provider, provider_subject, created_at, updated_at`,
		[userId, email, passwordHash],
	);
	return rows[0];
}

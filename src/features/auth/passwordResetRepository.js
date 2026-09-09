import pool from "../../../db/pool.js";

export async function findEligibleLocalIdentityForUpdate({ email }, db) {
	const { rows } = await db.query(
		`SELECT ai.id, ai.user_id, u.email
		 FROM auth_identities ai
		 JOIN users u ON u.id = ai.user_id
		 WHERE ai.provider = 'local' AND ai.provider_subject = $1
		   AND u.is_active = TRUE AND u.role <> 'guest'
		 FOR UPDATE OF ai`,
		[email],
	);
	return rows[0] ?? null;
}

export async function invalidateActive({ identityId }, db) {
	await db.query(
		`UPDATE password_reset_tokens SET consumed_at = NOW()
		 WHERE auth_identity_id = $1 AND consumed_at IS NULL`,
		[identityId],
	);
}

export async function create({ identityId, tokenHash, expiresAt }, db) {
	const { rows } = await db.query(
		`INSERT INTO password_reset_tokens (auth_identity_id, token_hash, expires_at)
		 VALUES ($1, $2, $3)
		 RETURNING id, auth_identity_id, token_hash, created_at, expires_at, consumed_at`,
		[identityId, tokenHash, expiresAt],
	);
	return rows[0];
}

export async function findUsableForUpdate({ tokenHash }, db) {
	const { rows } = await db.query(
		`SELECT prt.id, prt.auth_identity_id, ai.user_id
		 FROM password_reset_tokens prt
		 JOIN auth_identities ai ON ai.id = prt.auth_identity_id AND ai.provider = 'local'
		 JOIN users u ON u.id = ai.user_id
		 WHERE prt.token_hash = $1 AND prt.consumed_at IS NULL
		   AND prt.expires_at > NOW() AND u.is_active = TRUE AND u.role <> 'guest'
		 FOR UPDATE OF prt, ai`,
		[tokenHash],
	);
	return rows[0] ?? null;
}

export async function isUsable({ tokenHash }, db = pool) {
	const { rows } = await db.query(
		`SELECT EXISTS (
		 SELECT 1 FROM password_reset_tokens prt
		 JOIN auth_identities ai ON ai.id = prt.auth_identity_id AND ai.provider = 'local'
		 JOIN users u ON u.id = ai.user_id
		 WHERE prt.token_hash = $1 AND prt.consumed_at IS NULL
		   AND prt.expires_at > NOW() AND u.is_active = TRUE AND u.role <> 'guest'
		) AS usable`,
		[tokenHash],
	);
	return rows[0].usable;
}

export async function updatePassword({ identityId, passwordHash }, db) {
	const result = await db.query(
		`UPDATE auth_identities SET password_hash = $2, updated_at = NOW()
		 WHERE id = $1 AND provider = 'local'`,
		[identityId, passwordHash],
	);
	if (result.rowCount !== 1) throw new Error("Local identity password update failed");
}

/** @param {{userId: number}} input @param {import("pg").Pool | import("pg").PoolClient} [db] */
export async function invalidateUserSessions({ userId }, db = pool) {
	await db.query(`DELETE FROM "session" WHERE sess #>> '{passport,user}' = $1`, [
		String(userId),
	]);
}

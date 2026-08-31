import pool from "../../../db/pool.js";

/**
 * Deletes one bounded batch of expired guest principals. Foreign-key cascades
 * remove only resources rooted in those guest user IDs.
 * @param {{batchSize?: number, now?: Date}} [input]
 * @param {any} [db]
 */
export default async function cleanupExpiredGuests(
	{
		batchSize = Number(process.env.GUEST_CLEANUP_BATCH_SIZE || 100),
		now = new Date(),
	} = {},
	db = pool,
) {
	if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1000) {
		throw new Error("Guest cleanup batch size must be between 1 and 1000");
	}
	const { rows } = await db.query(
		`WITH expired AS (
			SELECT id FROM users
			WHERE role = 'guest' AND guest_expires_at <= $1
			ORDER BY guest_expires_at, id
			LIMIT $2
			FOR UPDATE SKIP LOCKED
		)
		DELETE FROM users u USING expired
		WHERE u.id = expired.id AND u.role = 'guest'
		RETURNING u.id`,
		[now, batchSize],
	);
	await db.query(
		"DELETE FROM guest_creation_limits WHERE window_started_at < NOW() - INTERVAL '1 day'",
	);
	return { deletedCount: rows.length, deletedIds: rows.map((row) => row.id) };
}

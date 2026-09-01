import cleanupExpiredGuests from "../features/guests/cleanupExpiredGuests.js";
import pool from "../../db/pool.js";

try {
	const result = await cleanupExpiredGuests();
	console.log(`Deleted ${result.deletedCount} expired guest account(s).`);
} catch (error) {
	console.error(
		"Guest cleanup failed:",
		error instanceof Error ? error.message : error,
	);
	process.exitCode = 1;
} finally {
	await pool.end();
}

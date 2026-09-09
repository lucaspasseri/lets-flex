import { createHash } from "node:crypto";
import pool from "../../../db/pool.js";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export default async function rateLimitPasswordReset(req, res, next) {
	try {
		const keyHash = createHash("sha256")
			.update(`${process.env.SESSION_SECRET}:${req.ip}`)
			.digest("hex");
		const windowStartedAt = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS);
		const { rows } = await pool.query(
			`INSERT INTO password_reset_request_limits (key_hash, window_started_at, attempts)
			 VALUES ($1, $2, 1)
			 ON CONFLICT (key_hash, window_started_at)
			 DO UPDATE SET attempts = password_reset_request_limits.attempts + 1
			 RETURNING attempts`,
			[keyHash, windowStartedAt],
		);
		if (rows[0].attempts > MAX_ATTEMPTS) {
			res.status(429).send("Too many reset requests. Try again later.");
			return;
		}
		next();
	} catch (error) {
		next(error);
	}
}

import { createHash } from "node:crypto";
import pool from "../../../db/pool.js";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

/** @type {import("express").RequestHandler} */
export default async function rateLimitGuestCreation(req, res, next) {
	try {
		const keyHash = createHash("sha256")
			.update(`${process.env.SESSION_SECRET}:${req.ip}`)
			.digest("hex");
		const windowStartedAt = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS);
		const { rows } = await pool.query(
			`INSERT INTO guest_creation_limits (key_hash, window_started_at, attempts)
			 VALUES ($1, $2, 1)
			 ON CONFLICT (key_hash, window_started_at)
			 DO UPDATE SET attempts = guest_creation_limits.attempts + 1
			 RETURNING attempts`,
			[keyHash, windowStartedAt],
		);
		if (rows[0].attempts > MAX_ATTEMPTS) {
			res.status(429).send("Too many guest accounts created. Try again later.");
			return;
		}
		next();
	} catch (error) {
		next(error);
	}
}

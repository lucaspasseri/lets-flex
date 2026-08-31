import { Client } from "pg";

import { schemaSql } from "./schema.js";
import normalizeEmail from "../src/features/auth/normalizeEmail.js";
import { hashPassword } from "../src/features/auth/passwordService.js";

export async function seedDatabase(connectionString = process.env.DATABASE_URL) {
	if (process.env.NODE_ENV === "production") {
		throw new Error("Refusing to reset the database in production");
	}
	if (process.env.ALLOW_DATABASE_RESET !== "true") {
		throw new Error("Database reset requires ALLOW_DATABASE_RESET=true");
	}
	if (!connectionString) {
		throw new Error("DATABASE_URL is required");
	}

	const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
	const adminPassword = process.env.ADMIN_PASSWORD;
	if (!adminEmail || !adminEmail.includes("@")) {
		throw new Error("ADMIN_EMAIL must be a valid email address");
	}
	if (!adminPassword) {
		throw new Error("ADMIN_PASSWORD is required");
	}

	// Validate and hash before any destructive operation begins.
	const passwordHash = await hashPassword(adminPassword);
	console.log("Resetting and seeding the development database...");

	const client = new Client({
		connectionString,
		ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : false,
	});

	try {
		await client.connect();
		await client.query("BEGIN");
		await client.query(schemaSql);
		await client.query(
			`INSERT INTO users (email, password_hash, role, name)
			 VALUES ($1, $2, 'admin', 'Administrator')
			 ON CONFLICT (email) WHERE email IS NOT NULL
			 DO UPDATE SET password_hash = EXCLUDED.password_hash,
			               role = 'admin', is_active = TRUE, updated_at = NOW()`,
			[adminEmail, passwordHash],
		);
		await client.query("COMMIT");
		console.log("Database seeded successfully.");
	} catch (error) {
		await client.query("ROLLBACK").catch(() => {});
		console.error("Error while seeding database:", error);
		throw error;
	} finally {
		await client.end();
		console.log("Connection closed.");
	}
}

await seedDatabase();

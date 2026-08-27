import { Client } from "pg";

import { schemaSql } from "./schema.js";

export async function seedDatabase(connectionString = process.env.DATABASE_URL) {
	console.log("Seeding database...");

	const client = new Client({
		connectionString,
		ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : false,
	});

	try {
		await client.connect();
		await client.query(schemaSql);
		console.log("Database seeded successfully.");
	} catch (error) {
		console.error("Error while seeding database:", error);
		throw error;
	} finally {
		await client.end();
		console.log("Connection closed.");
	}
}

await seedDatabase();

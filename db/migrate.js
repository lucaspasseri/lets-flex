import { readdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Client } from "pg";

const migrationsDirectory = dirname(fileURLToPath(import.meta.url)) + "/migrations";

function isSafeMigrationTarget(connectionString) {
	try {
		const url = new URL(connectionString);
		const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
		const databaseName = url.pathname.slice(1);

		return (
			localHosts.has(url.hostname) ||
			/(?:^|[_-])(dev|development|local|test)(?:$|[_-])/.test(databaseName)
		);
	} catch {
		return false;
	}
}

/**
 * Validate the explicit, non-production target contract before connecting.
 * @param {{connectionString?: string, environment?: NodeJS.ProcessEnv}} [options]
 */
export function validateMigrationTarget({
	connectionString = process.env.DATABASE_URL,
	environment = process.env,
} = {}) {
	if (environment.ALLOW_DATABASE_MIGRATION !== "true") {
		throw new Error("Database migration requires ALLOW_DATABASE_MIGRATION=true");
	}
	if (environment.NODE_ENV === "production") {
		if (environment.ALLOW_PRODUCTION_DATABASE_MIGRATION !== "true") {
			throw new Error(
				"Production migration requires ALLOW_PRODUCTION_DATABASE_MIGRATION=true",
			);
		}
		if (!connectionString) {
			throw new Error("DATABASE_URL is required");
		}
		try {
			new URL(connectionString);
		} catch {
			throw new Error("DATABASE_URL must be a valid PostgreSQL URL");
		}
		return connectionString;
	}
	if (!connectionString) {
		throw new Error("DATABASE_URL is required");
	}
	if (!isSafeMigrationTarget(connectionString)) {
		throw new Error(
			"Refusing to migrate a database that is not local or explicitly named for development/test",
		);
	}
	return connectionString;
}

export async function loadMigrations() {
	const files = (await readdir(migrationsDirectory))
		.filter((file) => file.endsWith(".js"))
		.sort();

	const migrations = [];
	for (const file of files) {
		const migration = await import(pathToFileURL(join(migrationsDirectory, file)).href);
		if (typeof migration.name !== "string" || typeof migration.sql !== "string") {
			throw new Error(`Invalid migration module: ${basename(file)}`);
		}
		migrations.push({ name: migration.name, sql: migration.sql });
	}

	return migrations;
}

/**
 * Apply unapplied migrations in filename order, one transaction per migration.
 * @param {{connectionString?: string, environment?: NodeJS.ProcessEnv}} [options]
 */
export async function migrateDatabase(options = {}) {
	const connectionString = validateMigrationTarget(options);
	const migrations = await loadMigrations();
	const client = new Client({
		connectionString,
		ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : false,
	});

	try {
		await client.connect();
		await client.query(`
			CREATE TABLE IF NOT EXISTS schema_migrations (
				name VARCHAR(255) PRIMARY KEY,
				applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)
		`);

		const appliedRows = await client.query(
			"SELECT name FROM schema_migrations ORDER BY name",
		);
		const applied = new Set(appliedRows.rows.map((row) => row.name));

		for (const migration of migrations) {
			if (applied.has(migration.name)) continue;

			await client.query("BEGIN");
			try {
				await client.query(migration.sql);
				await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
					migration.name,
				]);
				await client.query("COMMIT");
				console.log(`Applied database migration: ${migration.name}`);
			} catch (error) {
				await client.query("ROLLBACK").catch(() => {});
				throw error;
			}
		}
	} finally {
		await client.end();
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await migrateDatabase();
}

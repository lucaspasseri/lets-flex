import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { resetAndSeedDatabase, seedSql } from "./seed.js";
import { schemaSql } from "./schema.js";
import { catalogTranslationSeedSql } from "./catalogTranslationsSql.js";
import { catalogSeedSql } from "../src/features/exerciseCatalog/createCatalogSeedSql.js";
import { starterWorkoutSeedSql } from "../src/features/guests/createStarterWorkoutSeedSql.js";
import { mediaSeedSql } from "./mediaSeedSql.js";
import { CanonicalRegistryPreflightError } from "../src/features/media/registry/canonicalMediaRegistryRecovery.js";

function runSeed(environment) {
	return spawnSync(process.execPath, ["db/seed.js"], {
		cwd: process.cwd(),
		env: { ...process.env, ...environment },
		encoding: "utf8",
	});
}

test("complete seed SQL command prints the fully resolved seedSql export", () => {
	const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
	const result = spawnSync(npmCommand, ["run", "--silent", "db:seed:sql"], {
		cwd: process.cwd(),
		encoding: "utf8",
	});

	assert.equal(result.status, 0, result.stderr);
	assert.equal(result.stderr, "");
	assert.equal(result.stdout, seedSql);
	assert.match(result.stdout, /INSERT INTO "step_types"/);
	assert.ok(result.stdout.includes(catalogSeedSql.trim()));
	assert.ok(result.stdout.includes(catalogTranslationSeedSql.trim()));
	assert.match(result.stdout, /'pt-BR'/);
	assert.ok(result.stdout.includes(starterWorkoutSeedSql.trim()));
	assert.ok(result.stdout.includes(mediaSeedSql.trim()));
	assert.doesNotMatch(result.stdout, /\$\{[^}]+\}/);
	assert.doesNotMatch(result.stdout, /^\s*import\s/m);
});

test("complete setup SQL writes deterministic schema and canonical seed to the setup file", () => {
	const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
	const setupFile = fileURLToPath(new URL("./setup.sql", import.meta.url));
	const result = spawnSync(npmCommand, ["run", "--silent", "db:setup:sql"], {
		cwd: process.cwd(),
		encoding: "utf8",
	});

	assert.equal(result.status, 0, result.stderr);
	assert.equal(result.stderr, "");
	assert.equal(result.stdout, `Database setup written to ${setupFile}\n`);

	const generatedSql = readFileSync(setupFile, "utf8");
	assert.equal(generatedSql, `${schemaSql.trim()}\n\n${seedSql.trim()}\n`);
	assert.match(generatedSql, /CREATE TABLE IF NOT EXISTS exercise_translations/);
	assert.ok(generatedSql.includes(catalogTranslationSeedSql.trim()));
	assert.ok(generatedSql.includes(mediaSeedSql.trim()));
	assert.match(generatedSql, /CREATE TABLE IF NOT EXISTS media_assets/);
	assert.match(generatedSql, /CREATE TABLE IF NOT EXISTS entity_media/);
	assert.match(generatedSql, /'pt-BR'/);
});

test("database reset refuses production even when explicitly requested", () => {
	const result = runSeed({
		NODE_ENV: "production",
		ALLOW_DATABASE_RESET: "true",
		PRODUCTION_DATABASE_RESET_MODE: "reset-and-restore",
		ALLOW_PRODUCTION_DB_RESET: "I_CONFIRM_PRODUCTION_DB_RESET",
		ADMIN_EMAIL: "admin@example.com",
		ADMIN_PASSWORD: "a sufficiently long test password",
	});
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /Refusing to reset the database in production/);
});

test("production reset implementation requires the exact confirmation", async () => {
	await assert.rejects(
		resetAndSeedDatabase({
			environment: {
				NODE_ENV: "production",
				PRODUCTION_DATABASE_RESET_MODE: "reset-and-restore",
			},
			allowProductionReset: true,
		}),
		/explicit reset authorization/,
	);
});

test("database reset requires an explicit opt-in", () => {
	const result = runSeed({
		NODE_ENV: "development",
		ALLOW_DATABASE_RESET: "false",
		ADMIN_EMAIL: "admin@example.com",
		ADMIN_PASSWORD: "a sufficiently long test password",
	});
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /ALLOW_DATABASE_RESET=true/);
});

test("database reset requires an explicit development or test runtime", () => {
	const result = runSeed({
		NODE_ENV: "staging",
		ALLOW_DATABASE_RESET: "true",
		DATABASE_URL: "postgresql://localhost/lets_flex",
		ADMIN_EMAIL: "admin@example.com",
		ADMIN_PASSWORD: "a sufficiently long test password",
	});
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /NODE_ENV=development or NODE_ENV=test/);
});

test("database reset refuses an ambiguous remote target", () => {
	const result = runSeed({
		NODE_ENV: "development",
		ALLOW_DATABASE_RESET: "true",
		DATABASE_URL: "postgresql://database.example.com/lets_flex",
		ADMIN_EMAIL: "admin@example.com",
		ADMIN_PASSWORD: "a sufficiently long test password",
	});
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /not local or explicitly named for development\/test/);
});

test("database reset preflights the canonical registry before opening a destructive database connection", async () => {
	const originalEnvironment = {
		NODE_ENV: process.env.NODE_ENV,
		ALLOW_DATABASE_RESET: process.env.ALLOW_DATABASE_RESET,
		ADMIN_EMAIL: process.env.ADMIN_EMAIL,
		ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
	};
	Object.assign(process.env, {
		NODE_ENV: "development",
		ALLOW_DATABASE_RESET: "true",
		ADMIN_EMAIL: "admin@example.com",
		ADMIN_PASSWORD: "a sufficiently long test password",
	});
	try {
		const { seedDatabase } = await import("./seed.js");
		await assert.rejects(
			() =>
				seedDatabase("postgresql://127.0.0.1:1/lets_flex_dev", {
					canonicalRegistry: /** @type {any} */ ({
						async listCanonicalOverrides() {
							throw new Error("registry unavailable");
						},
					}),
					mediaStorage: /** @type {any} */ ({
						async exists() {
							return true;
						},
					}),
				}),
			CanonicalRegistryPreflightError,
		);
	} finally {
		for (const [name, value] of Object.entries(originalEnvironment)) {
			if (value === undefined) delete process.env[name];
			else process.env[name] = value;
		}
	}
});

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { seedSql } from "./seed.js";
import { catalogSeedSql } from "../src/features/exerciseCatalog/createCatalogSeedSql.js";
import { starterWorkoutSeedSql } from "../src/features/guests/createStarterWorkoutSeedSql.js";

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
	assert.ok(result.stdout.includes(starterWorkoutSeedSql.trim()));
	assert.doesNotMatch(result.stdout, /\$\{[^}]+\}/);
	assert.doesNotMatch(result.stdout, /^\s*import\s/m);
});

test("database reset refuses production even when explicitly requested", () => {
	const result = runSeed({
		NODE_ENV: "production",
		ALLOW_DATABASE_RESET: "true",
		ADMIN_EMAIL: "admin@example.com",
		ADMIN_PASSWORD: "a sufficiently long test password",
	});
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /Refusing to reset the database in production/);
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

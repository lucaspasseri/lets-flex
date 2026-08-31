import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function runSeed(environment) {
	return spawnSync(process.execPath, ["db/seed.js"], {
		cwd: process.cwd(),
		env: { ...process.env, ...environment },
		encoding: "utf8",
	});
}

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

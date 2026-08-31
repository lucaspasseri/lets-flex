import assert from "node:assert/strict";
import test from "node:test";
import normalizeEmail from "./normalizeEmail.js";
import { hashPassword, verifyPassword } from "./passwordService.js";
import { safeReturnTo } from "../../interfaces/validation/authSchemas.js";

test("email normalization is stable", () => {
	assert.equal(normalizeEmail("  Person@Example.COM "), "person@example.com");
	assert.equal(normalizeEmail(null), "");
});

test("Argon2id hashes verify without exposing plaintext", async () => {
	const password = "correct horse battery staple";
	const hash = await hashPassword(password);
	assert.notEqual(hash, password);
	assert.equal(await verifyPassword(hash, password), true);
	assert.equal(await verifyPassword(hash, "incorrect password"), false);
});

test("post-authentication redirects stay local", () => {
	assert.equal(safeReturnTo("/programs?programId=2"), "/programs?programId=2");
	assert.equal(safeReturnTo("//evil.example"), "/");
	assert.equal(safeReturnTo("https://evil.example"), "/");
});

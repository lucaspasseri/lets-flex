import test from "node:test";
import assert from "node:assert/strict";
import { createUserSchema } from "./createUserSchema.js";

test("create user validation trims values and maps the HTTP field names", () => {
	const result = createUserSchema.parse({
		name: "  Ada Lovelace  ",
		dob: " 1815-12-10 ",
		anamnesis: "  Previous ankle injury.  ",
		extra: "discarded",
	});

	assert.deepEqual(result, {
		name: "Ada Lovelace",
		dateOfBirth: "1815-12-10",
		anamnesis: "Previous ankle injury.",
	});
});

test("create user validation rejects empty, impossible, and oversized values", () => {
	const result = createUserSchema.safeParse({
		name: "   ",
		dob: "2024-02-31",
		anamnesis: "x".repeat(1001),
	});

	assert.equal(result.success, false);
	assert.deepEqual(
		new Set(result.error.issues.map((issue) => issue.path[0])),
		new Set(["name", "dob", "anamnesis"]),
	);
});

test("create user validation normalizes empty health notes to null", () => {
	const result = createUserSchema.parse({
		name: "Grace Hopper",
		dob: "1906-12-09",
		anamnesis: "   ",
	});

	assert.equal(result.anamnesis, null);
});

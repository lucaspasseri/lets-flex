import assert from "node:assert/strict";
import test from "node:test";

import {
	existingMediaBodySchema,
	mediaManagementQuerySchema,
	mediaUploadBodySchema,
	removeMediaBodySchema,
} from "./mediaManagementSchemas.js";

test("media management schemas normalize supported entity and optional alt-text fields", () => {
	assert.deepEqual(
		mediaManagementQuerySchema.parse({
			entity: "exercise:9",
			entityType: "muscle",
			search: " bench ",
		}),
		{ entity: "exercise:9", entityType: "muscle", search: "bench" },
	);
	assert.deepEqual(
		mediaUploadBodySchema.parse({
			entityType: "exercise",
			entityId: "9",
			altTextEn: " Bench press ",
			altTextPtBr: "",
		}),
		{
			entityType: "exercise",
			entityId: 9,
			altTextEn: "Bench press",
			altTextPtBr: undefined,
		},
	);
});

test("media management schemas reject unsupported entities, IDs, assets, and long alt text", () => {
	assert.throws(() => mediaManagementQuerySchema.parse({ entity: "environment:2" }));
	assert.throws(() => mediaManagementQuerySchema.parse({ entityType: "session" }));
	assert.throws(() =>
		removeMediaBodySchema.parse({ entityType: "exercise", entityId: "0" }),
	);
	assert.throws(() =>
		existingMediaBodySchema.parse({
			entityType: "exercise",
			entityId: "9",
			mediaAssetId: "0",
		}),
	);
	assert.throws(() =>
		mediaUploadBodySchema.parse({
			entityType: "exercise",
			entityId: "9",
			altTextEn: "x".repeat(501),
		}),
	);
});

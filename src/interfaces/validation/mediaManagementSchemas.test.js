import assert from "node:assert/strict";
import test from "node:test";

import {
	approveMediaGenerationCandidateBodySchema,
	existingMediaBodySchema,
	generateMediaBodySchema,
	mediaGenerationCandidateParamsSchema,
	regenerateMediaBodySchema,
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

test("media generation schema narrows targets, refinements, and candidate identifiers", () => {
	assert.deepEqual(
		generateMediaBodySchema.parse({
			entityType: "equipment",
			entityId: "9",
			requestNonce: "94c4ff6c-f2a3-431c-a26d-52f31f00bc17",
			refinement: "  front three-quarter view ",
		}),
		{
			entityType: "equipment",
			entityId: 9,
			requestNonce: "94c4ff6c-f2a3-431c-a26d-52f31f00bc17",
			refinement: "front three-quarter view",
		},
	);
	assert.deepEqual(
		generateMediaBodySchema.parse({
			entityType: "equipment",
			entityId: "9",
			requestNonce: "94c4ff6c-f2a3-431c-a26d-52f31f00bc17",
			refinement: "",
		}),
		{
			entityType: "equipment",
			entityId: 9,
			requestNonce: "94c4ff6c-f2a3-431c-a26d-52f31f00bc17",
			refinement: undefined,
		},
	);
	const unsupportedMuscle = generateMediaBodySchema.safeParse({
		entityType: "muscle",
		entityId: "9",
		requestNonce: "94c4ff6c-f2a3-431c-a26d-52f31f00bc17",
		refinement: "",
	});
	assert.equal(unsupportedMuscle.success, false);
	if (!unsupportedMuscle.success) {
		assert.equal(
			unsupportedMuscle.error.issues[0]?.message,
			"AI generation supports exercises, global variants, equipment, and movement patterns.",
		);
	}
	assert.throws(() => mediaGenerationCandidateParamsSchema.parse({ candidateId: "0" }));
	assert.equal(mediaManagementQuerySchema.parse({ saved: "approve" }).saved, "approve");
	assert.equal(
		regenerateMediaBodySchema.parse({
			entityType: "exercise",
			entityId: "9",
			candidateId: "13",
			requestNonce: "94c4ff6c-f2a3-431c-a26d-52f31f00bc17",
		}).candidateId,
		13,
	);
	assert.deepEqual(
		approveMediaGenerationCandidateBodySchema.parse({
			entityType: "exercise",
			entityId: "9",
			altTextEn: " Bench press ",
			altTextPtBr: " Supino reto ",
		}),
		{
			entityType: "exercise",
			entityId: 9,
			altTextEn: "Bench press",
			altTextPtBr: "Supino reto",
		},
	);
	assert.throws(() =>
		approveMediaGenerationCandidateBodySchema.parse({
			entityType: "exercise",
			entityId: "9",
			altTextEn: "Bench press",
			altTextPtBr: "",
		}),
	);
});

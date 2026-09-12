import assert from "node:assert/strict";
import test from "node:test";

import {
	translationMaintenanceBodySchema,
	translationMaintenanceParamsSchema,
	translationOverviewQuerySchema,
} from "./translationMaintenanceSchemas.js";

test("translation overview query accepts supported filters and normalizes blanks", () => {
	const result = translationOverviewQuerySchema.safeParse({
		entityType: "exercise_variant",
		status: "missing-pt-BR",
		search: " Bench Press ",
	});
	assert.equal(result.success, true);
	if (result.success) {
		assert.deepEqual(result.data, {
			entityType: "exercise_variant",
			status: "missing-pt-BR",
			search: "Bench Press",
		});
	}

	const blankResult = translationOverviewQuerySchema.safeParse({
		entityType: "",
		status: "",
		search: "",
	});
	assert.equal(blankResult.success, true);
	if (blankResult.success) {
		assert.deepEqual(blankResult.data, {
			entityType: undefined,
			status: undefined,
			search: undefined,
		});
	}
});

test("translation overview query rejects unsupported filters", () => {
	for (const input of [
		{ entityType: "session" },
		{ status: "translated" },
		{ search: "x".repeat(101) },
	]) {
		const result = translationOverviewQuerySchema.safeParse(input);
		assert.equal(result.success, false);
	}
});

test("translation editor params and body accept only supported values", () => {
	assert.deepEqual(
		translationMaintenanceParamsSchema.parse({
			entityType: "exercise",
			entityId: "42",
		}),
		{ entityType: "exercise", entityId: 42 },
	);
	assert.deepEqual(
		translationMaintenanceBodySchema.parse({ locale: "pt-BR", name: " Supino reto " }),
		{ locale: "pt-BR", name: "Supino reto" },
	);

	for (const input of [
		{ entityType: "session", entityId: "42" },
		{ entityType: "exercise", entityId: "0" },
		{ locale: "fr-FR", name: "Bench Press" },
		{ locale: "en", name: "   " },
		{ locale: "en", name: "x".repeat(101) },
	]) {
		const result =
			"entityType" in input
				? translationMaintenanceParamsSchema.safeParse(input)
				: translationMaintenanceBodySchema.safeParse(input);
		assert.equal(result.success, false);
	}
});

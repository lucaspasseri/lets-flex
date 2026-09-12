import assert from "node:assert/strict";
import test from "node:test";

import {
	getTranslationEntityDefinition,
	getTranslationEntityTypes,
	getTranslationStatus,
	resolveTranslationPreview,
	TRANSLATION_MUTATION_POLICY,
	TRANSLATION_STATUS,
	TranslationMaintenanceValidationError,
	validateTranslationInput,
} from "./translationMaintenanceContract.js";

test("maintenance contract covers only global Phase 3 catalog entities", () => {
	assert.deepEqual(getTranslationEntityTypes(), [
		"exercise",
		"exercise_variant",
		"muscle",
		"equipment",
		"movement_pattern",
	]);

	for (const entityType of getTranslationEntityTypes()) {
		const definition = getTranslationEntityDefinition(entityType);
		assert.ok(definition);
		assert.equal(definition.globalOnly, true);
		assert.deepEqual(definition.fields, [
			{ key: "name", label: "Name", required: true },
		]);
	}
	assert.equal(getTranslationEntityDefinition("session"), null);
});

test("maintenance mutations are upserts and do not delete the English fallback", () => {
	assert.deepEqual(TRANSLATION_MUTATION_POLICY, {
		operation: "upsert",
		allowDelete: false,
		englishFallback: "canonical-when-english-row-is-absent",
	});
});

test("translation status is derived from translation rows, not canonical fallback", () => {
	assert.equal(
		getTranslationStatus({ en: "Bench Press", "pt-BR": "Supino reto" }),
		TRANSLATION_STATUS.COMPLETE,
	);
	assert.equal(
		getTranslationStatus({ en: "Bench Press" }),
		TRANSLATION_STATUS.MISSING_PORTUGUESE,
	);
	assert.equal(
		getTranslationStatus({ "pt-BR": "Supino reto" }),
		TRANSLATION_STATUS.MISSING_ENGLISH,
	);
	assert.equal(getTranslationStatus({}), TRANSLATION_STATUS.INCOMPLETE);
	assert.equal(
		getTranslationStatus({ en: "Bench Press", "pt-BR": "   " }),
		TRANSLATION_STATUS.MISSING_PORTUGUESE,
	);
});

test("translation preview follows active locale, English, then canonical fallback", () => {
	assert.deepEqual(
		resolveTranslationPreview({
			locale: "pt-BR",
			translations: { en: "Bench Press", "pt-BR": "Supino reto" },
			canonicalValue: "Legacy Bench Press",
		}),
		{ value: "Supino reto", source: "active-locale", locale: "pt-BR" },
	);
	assert.deepEqual(
		resolveTranslationPreview({
			locale: "pt-BR",
			translations: { en: "Bench Press" },
			canonicalValue: "Legacy Bench Press",
		}),
		{ value: "Bench Press", source: "english-fallback", locale: "en" },
	);
	assert.deepEqual(
		resolveTranslationPreview({
			locale: "en",
			translations: {},
			canonicalValue: "Legacy Bench Press",
		}),
		{ value: "Legacy Bench Press", source: "canonical", locale: "canonical" },
	);
});

test("translation input accepts supported locales and trims only outer whitespace", () => {
	assert.deepEqual(
		validateTranslationInput({
			entityType: "exercise",
			entityId: 42,
			locale: "pt-BR",
			name: "  Supino reto  ",
		}),
		{ entityType: "exercise", entityId: 42, locale: "pt-BR", name: "Supino reto" },
	);
});

test("translation input rejects unsupported, empty, and invalid values", () => {
	for (const input of [
		{ entityType: "session", entityId: 1, locale: "en", name: "Session" },
		{ entityType: "exercise", entityId: 0, locale: "en", name: "Exercise" },
		{ entityType: "exercise", entityId: 1, locale: "pt-PT", name: "Exercício" },
		{ entityType: "exercise", entityId: 1, locale: "pt-BR", name: "  " },
	]) {
		assert.throws(
			() => validateTranslationInput(input),
			TranslationMaintenanceValidationError,
		);
	}
});

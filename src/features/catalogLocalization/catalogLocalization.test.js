import assert from "node:assert/strict";
import test from "node:test";

import * as equipmentRepository from "../equipments/repository.js";
import * as exerciseTemplateRepository from "../exerciseTemplates/repository.js";
import * as movementPatternRepository from "../movementPatterns/repository.js";
import * as muscleRepository from "../muscles/repository.js";
import * as sessionRepository from "../sessions/repository.js";
import * as workoutSessionRepository from "../workoutSessions/repository.js";
import * as exerciseTemplateQueries from "../exerciseTemplates/queries.js";
import * as sessionQueries from "../sessions/queries.js";
import * as workoutSessionQueries from "../workoutSessions/queries.js";
import {
	localizedCatalogJoinSql,
	localizedCatalogLocaleSql,
	localizedCatalogValueSql,
	normalizeCatalogLocale,
} from "./catalogLocalization.js";

/** @returns {any} */
function fakeDatabase() {
	const calls = [];
	return {
		calls,
		async query(text, values) {
			calls.push({ text, values });
			return { rows: [] };
		},
	};
}

test("catalog locale normalization keeps unsupported values on English", () => {
	assert.equal(normalizeCatalogLocale("pt-BR"), "pt-BR");
	assert.equal(normalizeCatalogLocale("en"), "en");
	assert.equal(normalizeCatalogLocale("pt-PT"), "en");
	assert.equal(normalizeCatalogLocale(undefined), "en");
});

test("localized catalog SQL resolves active locale, English, then canonical text", () => {
	const join = localizedCatalogJoinSql({
		translationTable: "exercise_translations",
		translationEntityColumn: "exercise_id",
		entityIdExpression: "exercises.id",
		alias: "exercise_translation",
		localeParameter: "$2",
	});

	assert.match(join, /FROM exercise_translations/);
	assert.match(join, /locale IN \(\$2, 'en'\)/);
	assert.match(join, /ORDER BY CASE WHEN locale = \$2 THEN 0 ELSE 1 END/);
	assert.match(
		localizedCatalogJoinSql({
			translationTable: "exercise_variant_translations",
			translationEntityColumn: "exercise_variant_id",
			entityIdExpression: "exercise_variants.id",
			alias: "exercise_variant_translation",
			localeParameter: "$2",
			additionalCondition: "exercise_variants.owner_user_id IS NULL",
		}),
		/AND exercise_variants\.owner_user_id IS NULL/,
	);
	assert.equal(
		localizedCatalogValueSql({
			alias: "exercise_translation",
			canonicalExpression: "exercises.name",
		}),
		"COALESCE(exercise_translation.name, exercises.name)",
	);
	assert.equal(
		localizedCatalogLocaleSql({ alias: "exercise_translation" }),
		"COALESCE(exercise_translation.locale, 'canonical')",
	);
});

test("catalog query boundaries use one locale-aware SQL read with bounded fallback joins", () => {
	for (const query of [
		exerciseTemplateQueries.findAllQuery(),
		sessionQueries.findAllQuery(),
		workoutSessionQueries.findAll(),
	]) {
		assert.match(query, /LEFT JOIN LATERAL/);
		assert.match(query, /locale IN \(\$2, 'en'\)/);
		assert.match(query, /COALESCE\([^)]*\.name/);
		assert.match(query, /exercise_translations/);
		assert.match(query, /exercise_variant_translations/);
		assert.match(query, /muscle_translations/);
		assert.match(query, /owner_user_id IS NULL/);
		assert.equal((query.match(/LEFT JOIN LATERAL/g) ?? []).length, 5);
		assert.equal((query.match(/LIMIT 1/g) ?? []).length, 5);
	}
});

test("catalog repositories pass the active locale and preserve canonical fallback metadata", async () => {
	const db = fakeDatabase();

	await equipmentRepository.findAll({ locale: "pt-BR" }, db);
	await movementPatternRepository.findAll({ locale: "pt-BR" }, db);
	await muscleRepository.findAll({ locale: "pt-BR" }, db);
	await exerciseTemplateRepository.findAllForUser({ userId: 7, locale: "pt-BR" }, db);
	await exerciseTemplateRepository.find({ exerciseId: 4, locale: "pt-BR" }, db);
	await sessionRepository.findVisibleForUser({ userId: 7, locale: "pt-BR" }, db);
	await workoutSessionRepository.findAllByTrainingDayId(
		{ trainingDayId: 11, locale: "pt-BR" },
		db,
	);

	assert.deepEqual(
		db.calls.map(({ values }) => values),
		[
			["pt-BR"],
			["pt-BR"],
			["pt-BR"],
			[7, "pt-BR"],
			[4, "pt-BR"],
			[7, "pt-BR"],
			[11, "pt-BR"],
		],
	);
	assert.equal(db.calls.length, 7);
	assert.match(
		db.calls[0].text,
		/COALESCE\(equipment_translation\.name, equipments\.name\)/,
	);
	assert.match(db.calls[3].text, /AS name_locale/);
	assert.match(db.calls[5].text, /exercise_name_locale/);
});

test("repository locale inputs fall back safely to English", async () => {
	const db = fakeDatabase();
	await equipmentRepository.findAll({ locale: "fr-FR" }, db);
	await sessionRepository.findVisibleForUser({ userId: 3, locale: "fr-FR" }, db);

	assert.deepEqual(
		db.calls.map(({ values }) => values),
		[["en"], [3, "en"]],
	);
});

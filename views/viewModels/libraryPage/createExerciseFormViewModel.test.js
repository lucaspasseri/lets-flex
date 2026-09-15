import assert from "node:assert/strict";
import test from "node:test";
import ejs from "ejs";
import path from "node:path";

import createExerciseFormViewModel from "./createExerciseFormViewModel.js";
import { i18n } from "../../../src/infrastructure/i18n/i18n.js";

const formBodyPath = path.resolve(
	"views/partials/libraryPage/createExerciseTemplateForm/createExerciseFormBody.ejs",
);

test("exercise catalog forms present localized labels with stable relationship IDs", () => {
	const form = createExerciseFormViewModel({
		equipments: [{ id: 7, name: "Barra", category: "Peso livre" }],
		movementPatterns: [{ id: 8, name: "Empurrar", notes: "" }],
		muscles: [
			{
				id: 9,
				commonName: "Peitoral",
				scientificName: "Pectoralis major",
				bodyPart: "Tronco",
				referenceUrl: "",
			},
		],
		muscleRoles: [{ id: 10, name: "Motor principal", description: "" }],
	});

	assert.deepEqual(form.fields.movementPatternOptions, [
		{ label: "Empurrar", value: 8 },
	]);
	assert.deepEqual(form.fields.equipmentOptions, [{ label: "Barra", value: 7 }]);
	assert.deepEqual(form.fields.muscleOptions, [
		{ label: "Peitoral (Pectoralis major)", value: 9 },
	]);
	assert.deepEqual(form.fields.muscleRoleOptions, [
		{ label: "Motor principal", value: 10 },
	]);
});

test("exercise form localizes muscle-role select labels while preserving stable IDs", async () => {
	const roles = [
		{ id: 10, key: "prime_mover", name: "Prime mover", description: "" },
		{ id: 11, key: "secondary_mover", name: "Secondary mover", description: "" },
		{ id: 12, key: "stabilizer", name: "Stabilizer", description: "" },
	];
	const createForm = (locale) =>
		createExerciseFormViewModel({
			equipments: [],
			movementPatterns: [],
			muscles: [],
			muscleRoles: roles,
			translate: i18n.getFixedT(locale),
		});

	const english = createForm("en");
	const portuguese = createForm("pt-BR");

	assert.deepEqual(english.fields.muscleRoleOptions, [
		{ label: "Primary", value: 10 },
		{ label: "Secondary", value: 11 },
		{ label: "Stabilizer", value: 12 },
	]);
	assert.deepEqual(portuguese.fields.muscleRoleOptions, [
		{ label: "Principal", value: 10 },
		{ label: "Secundário", value: 11 },
		{ label: "Estabilizador", value: 12 },
	]);

	const englishHtml = await ejs.renderFile(formBodyPath, {
		exerciseForm: english,
		t: i18n.getFixedT("en"),
	});
	const portugueseHtml = await ejs.renderFile(formBodyPath, {
		exerciseForm: portuguese,
		t: i18n.getFixedT("pt-BR"),
	});

	assert.match(englishHtml, /name="muscleRoleId"[\s\S]*value="10"[\s\S]*Primary/);
	assert.match(englishHtml, /name="muscleRoleId"[\s\S]*value="11"[\s\S]*Secondary/);
	assert.match(englishHtml, /name="muscleRoleId"[\s\S]*value="12"[\s\S]*Stabilizer/);
	assert.match(portugueseHtml, /name="muscleRoleId"[\s\S]*value="10"[\s\S]*Principal/);
	assert.match(portugueseHtml, /name="muscleRoleId"[\s\S]*value="11"[\s\S]*Secundário/);
	assert.match(
		portugueseHtml,
		/name="muscleRoleId"[\s\S]*value="12"[\s\S]*Estabilizador/,
	);
	assert.doesNotMatch(portugueseHtml, /Prime mover|Secondary mover|Stabilizer/);
});

import assert from "node:assert/strict";
import test from "node:test";

import createSessionFormViewModel from "./createSessionFormViewModel.js";
import { i18n } from "../../../src/infrastructure/i18n/i18n.js";

const squat = {
	id: 1,
	name: "Squat",
	movementPattern: { id: 1, name: "Squat", notes: "" },
	equipment: { id: 1, name: "Barbell", category: "Free weight" },
	muscles: [],
};

test("session exercise choices distinguish variants while preserving their identities", () => {
	const form = createSessionFormViewModel({
		stepTypes: [],
		exerciseTemplates: [
			{
				...squat,
				variant: {
					id: 11,
					name: "Barbell Back Squat",
					setupDescription: "",
					environment: "Gym",
					notes: "",
					ownerUserId: null,
					isArchived: false,
				},
			},
			{
				...squat,
				variant: {
					id: 12,
					name: "Goblet Squat",
					setupDescription: "",
					environment: "Gym",
					notes: "",
					ownerUserId: null,
					isArchived: false,
				},
			},
			{
				...squat,
				variant: {
					id: 13,
					name: "Tempo Squat",
					setupDescription: "",
					environment: "Home",
					notes: "",
					ownerUserId: 7,
					isArchived: false,
				},
			},
		],
	});

	assert.deepEqual(form.fields.exerciseOptions, [
		{ label: "Squat — Barbell Back Squat", value: 11 },
		{ label: "Squat — Goblet Squat", value: 12 },
		{ label: "Squat — Tempo Squat (Private)", value: 13 },
	]);
	assert.equal(
		new Set(form.fields.exerciseOptions.map((option) => option.value)).size,
		form.fields.exerciseOptions.length,
	);
	assert.equal(
		new Set(form.fields.exerciseOptions.map((option) => option.label)).size,
		form.fields.exerciseOptions.length,
	);
});

test("localized catalog labels render in exercise choices without changing submitted IDs", () => {
	const form = createSessionFormViewModel({
		stepTypes: [],
		exerciseTemplates: [
			{
				...squat,
				name: "Agachamento",
				variant: {
					id: 41,
					name: "Agachamento com barra",
					setupDescription: "",
					environment: "Gym",
					notes: "",
					ownerUserId: null,
					isArchived: false,
				},
			},
		],
	});

	assert.deepEqual(form.fields.exerciseOptions, [
		{ label: "Agachamento — Agachamento com barra", value: 41 },
	]);
});

test("step type options localize consistently in create and edit forms", () => {
	const stepTypes = [
		{ id: 1, name: "exercise" },
		{ id: 2, name: "warm_up" },
		{ id: 3, name: "cardio" },
		{ id: 4, name: "stretching" },
		{ id: 5, name: "mobility" },
		{ id: 6, name: "cooldown" },
	];
	const translatePt = i18n.getFixedT("pt-BR");
	const translateEn = i18n.getFixedT("en");
	const expected = [
		"Exercício",
		"Aquecimento",
		"Cardio",
		"Alongamento",
		"Mobilidade",
		"Desaquecimento",
	];

	for (const mode of /** @type {const} */ (["create", "update"])) {
		const form = createSessionFormViewModel({
			stepTypes,
			exerciseTemplates: [],
			mode,
			translate: translatePt,
		});
		assert.deepEqual(
			form.fields.stepTypeOptions.map((option) => option.label),
			expected,
		);
		assert.deepEqual(
			form.fields.stepTypeOptions.map((option) => option.value),
			[1, 2, 3, 4, 5, 6],
		);
	}

	const englishForm = createSessionFormViewModel({
		stepTypes,
		exerciseTemplates: [],
		translate: translateEn,
	});
	assert.deepEqual(
		englishForm.fields.stepTypeOptions.map((option) => option.label),
		["Exercise", "Warm up", "Cardio", "Stretching", "Mobility", "Cooldown"],
	);
});

test("contextual creation preserves only the owned day identity and changes return signposting", () => {
	const form = createSessionFormViewModel({
		stepTypes: [],
		exerciseTemplates: [],
		creationContext: /** @type {any} */ ({
			program: { name: "Strength plan" },
			cycle: { name: "Foundation" },
			day: {
				id: 18,
				dayOrder: 2,
				label: "Lower body",
				scheduledDate: "2026-09-02",
			},
		}),
	});

	assert.equal(form.modal.openOnLoad, true);
	assert.equal(form.fields.contextDayId, 18);
	assert.equal(form.actions.submit.label, "Create and return");
	assert.match(form.form.description, /review and assign/);
	assert.equal(
		form.fields.creationContext?.pathLabel,
		"Strength plan · Foundation · Lower body",
	);
});

import assert from "node:assert/strict";
import test from "node:test";

import { i18n } from "../../../src/infrastructure/i18n/i18n.js";
import createTranslationEditPageViewModel from "./createTranslationEditPageViewModel.js";

const record = {
	entityType: "exercise_variant",
	id: 43,
	canonicalName: "Barbell Bench Press",
	englishName: "Barbell Bench Press",
	portugueseName: null,
	status: "missing-pt-BR",
	preview: {
		english: { value: "Barbell Bench Press", source: "english" },
		portuguese: { value: "Barbell Bench Press", source: "english-fallback" },
	},
};

test("translation editor localizes locale forms and shows fallback context", () => {
	const viewModel = createTranslationEditPageViewModel({
		page: {},
		currentUser: { id: 1, role: "admin" },
		record,
		savedLocale: "pt-BR",
		translate: i18n.getFixedT("pt-BR"),
	});

	assert.equal(viewModel.shell.activeNavigation, "admin-translations");
	assert.equal(viewModel.components.heading.meta, "Variações globais de exercícios");
	assert.equal(viewModel.components.localeForms[0].label, "English");
	assert.equal(viewModel.components.localeForms[1].label, "Português (Brasil)");
	assert.equal(
		viewModel.components.localeForms[1].previewLabel,
		"Os usuários veem atualmente Barbell Bench Press (origem: tradução em inglês).",
	);
	assert.equal(
		viewModel.components.savedMessage,
		"Tradução em Português (Brasil) salva.",
	);
});

test("translation editor preserves submitted values and associates field errors", () => {
	const viewModel = createTranslationEditPageViewModel({
		page: {},
		currentUser: null,
		record,
		formState: {
			locale: "pt-BR",
			values: { locale: "pt-BR", name: "Supino <reto>" },
			errors: { fieldErrors: { name: "Enter a translation name." }, formErrors: [] },
		},
	});

	assert.equal(viewModel.components.localeForms[0].value, "Barbell Bench Press");
	assert.equal(viewModel.components.localeForms[1].value, "Supino <reto>");
	assert.equal(viewModel.components.localeForms[1].error, "Enter a translation name.");
});

import assert from "node:assert/strict";
import test from "node:test";

import { i18n } from "../../../src/infrastructure/i18n/i18n.js";
import getTranslationOverview from "../../../src/features/translationMaintenance/getTranslationOverview.js";
import createTranslationMaintenancePageViewModel from "./createTranslationMaintenancePageViewModel.js";

const overview = {
	filters: { entityType: null, status: null, search: null },
	records: [
		{
			entityType: "exercise",
			id: 42,
			editHref: "/admin/translations/exercise/42",
			canonicalName: "Bench Press",
			englishName: "Bench Press",
			portugueseName: "Supino reto",
			status: "complete",
			preview: {
				english: { value: "Bench Press" },
				portuguese: { value: "Supino reto" },
			},
		},
		{
			entityType: "exercise_variant",
			id: 43,
			editHref: "/admin/translations/exercise_variant/43",
			canonicalName: "Barbell Bench Press",
			englishName: "Barbell Bench Press",
			portugueseName: null,
			status: "missing-pt-BR",
			preview: {
				english: { value: "Barbell Bench Press" },
				portuguese: { value: "Barbell Bench Press" },
			},
		},
	],
	summary: {
		total: 2,
		statusCounts: { complete: 1, "missing-en": 0, "missing-pt-BR": 1, incomplete: 0 },
		entityCounts: {},
	},
};

test("translation maintenance view model localizes status and entity filters", () => {
	const viewModel = createTranslationMaintenancePageViewModel({
		page: { title: "Translation maintenance" },
		currentUser: { id: 1, name: "Administrator", role: "admin" },
		overview,
		translate: i18n.getFixedT("pt-BR"),
	});

	assert.equal(viewModel.shell.activeNavigation, "admin-translations");
	assert.equal(
		viewModel.translationMaintenance.heading.title,
		"Manutenção de traduções",
	);
	assert.equal(viewModel.translationMaintenance.statusCards[0].label, "Completo");
	assert.equal(
		viewModel.translationMaintenance.statusCards[1].label,
		"Português ausente",
	);
	assert.equal(
		viewModel.translationMaintenance.filters.entityOptions[0].label,
		"Todos os tipos de catálogo",
	);
	assert.equal(viewModel.translationMaintenance.records[1].portuguese.value, "Ausente");
	assert.equal(
		viewModel.translationMaintenance.records[1].portuguese.fallbackLabel,
		"Fallback exibido: Barbell Bench Press",
	);
});

test("translation maintenance view model remains compatible with overview service output", async () => {
	const db = {
		async query() {
			return {
				rows: [
					{
						entity_type: "equipment",
						id: 2,
						canonical_name: "Barbell",
						english_name: "Barbell",
						portuguese_name: "Barra",
					},
				],
			};
		},
	};
	const data = await getTranslationOverview({}, /** @type {any} */ (db));
	const viewModel = createTranslationMaintenancePageViewModel({
		page: {},
		currentUser: null,
		overview: data,
		translate: i18n.getFixedT("en"),
	});
	assert.equal(viewModel.translationMaintenance.records[0].entityLabel, "Equipment");
	assert.equal(viewModel.translationMaintenance.records[0].statusLabel, "Complete");
});

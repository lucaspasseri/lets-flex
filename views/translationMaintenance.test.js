import assert from "node:assert/strict";
import test from "node:test";
import ejs from "ejs";
import path from "node:path";

import createTranslationMaintenancePageViewModel from "./viewModels/translationMaintenance/createTranslationMaintenancePageViewModel.js";
import createTranslationEditPageViewModel from "./viewModels/translationMaintenance/createTranslationEditPageViewModel.js";
import { i18n } from "../src/infrastructure/i18n/i18n.js";

const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
	ejs.renderFile
);
const pagePath = path.resolve("views/translationMaintenance/index.ejs");
const editPagePath = path.resolve("views/translationMaintenance/edit.ejs");

const viewModel = createTranslationMaintenancePageViewModel({
	page: { title: "Translation maintenance" },
	currentUser: { id: 1, name: "Administrator", role: "admin" },
	overview: {
		filters: {
			entityType: null,
			status: null,
			search: null,
			entityOptions: [],
			statusOptions: [],
		},
		records: [
			{
				entityType: "exercise",
				id: 42,
				editHref: "/admin/translations/exercise/42",
				canonicalName: "Bench <Press>",
				englishName: "Bench <Press>",
				portugueseName: null,
				status: "missing-pt-BR",
				preview: {
					english: { value: "Bench <Press>" },
					portuguese: { value: "Bench <Press>" },
				},
			},
		],
		summary: {
			total: 1,
			statusCounts: { complete: 0, "missing-en": 0, "missing-pt-BR": 1, incomplete: 0 },
			entityCounts: {},
		},
	},
	translate: i18n.getFixedT("en"),
});

test("translation maintenance page renders accessible filters, table, fallback, and escaped values", async () => {
	const html = await renderFile(pagePath, viewModel);
	assert.match(html, /<main class="main translation-maintenance">/);
	assert.match(
		html,
		/<form class="translation-maintenance__filter-form" method="GET" action="\/admin\/translations">/,
	);
	assert.match(html, /<label class="form-field__label" for="translation-search">/);
	assert.match(html, /<div class="translation-maintenance__table-wrap" role="region"/);
	assert.match(html, /<th scope="col">English<\/th>/);
	assert.match(html, /Missing Portuguese/);
	assert.match(html, /Fallback shown: Bench &lt;Press&gt;/);
	assert.doesNotMatch(html, /Bench <Press>/);
});

test("translation editor renders locale forms, fallback guidance, and escaped record data", async () => {
	const viewModel = createTranslationEditPageViewModel({
		page: { title: "Edit translation" },
		currentUser: { id: 1, name: "Administrator", role: "admin" },
		record: {
			entityType: "exercise",
			entityLabel: "Exercises",
			id: 42,
			canonicalName: "Bench <Press>",
			englishName: "Bench Press",
			portugueseName: null,
			status: "missing-pt-BR",
			preview: {
				english: { value: "Bench Press", source: "english" },
				portuguese: { value: "Bench Press", source: "english-fallback" },
			},
		},
		translate: i18n.getFixedT("en"),
	});
	const html = await renderFile(editPagePath, viewModel);
	assert.match(
		html,
		/<main class="main translation-maintenance translation-maintenance--edit">/,
	);
	assert.equal(
		(html.match(/class="translation-maintenance__locale-form"/g) ?? []).length,
		2,
	);
	assert.match(html, /name="locale" value="pt-BR"/);
	assert.match(html, /Users currently see Bench Press from the English translation\./);
	assert.match(html, /name="_csrf"/);
	assert.match(html, /action="\/admin\/translations\/exercise\/42\?_method=PATCH"/);
	assert.doesNotMatch(html, /Bench <Press>/);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
	evaluateExerciseItem,
	evaluateSessionItem,
	initializeSearchAndFiltering,
} from "./searchAndFiltering.js";
import { initializeVariantCreateForm } from "./configureVariantCreateForm.js";
import { initializeDeleteSessionForm } from "./configureDeleteSessionFormAction.js";

test("session discovery combines expanded search metadata with independent facets", () => {
	const session = {
		searchText:
			"Lower strength coaching notes Squat Tempo goblet squat Dumbbell Quadriceps",
		filters: {
			movement: ["Squat"],
			muscle: ["Quadriceps"],
			equipment: ["Dumbbell"],
		},
	};

	assert.equal(
		evaluateSessionItem(session, {
			query: "coaching notes",
			baseFilters: { movement: "squat", equipment: "dumbbell" },
		}),
		true,
	);
	assert.equal(
		evaluateSessionItem(session, {
			query: "tempo goblet",
			baseFilters: { muscle: "hamstrings" },
		}),
		false,
	);
});

test("Library delete controls target the owner-scoped session delete route", () => {
	let listener;
	const root = {
		addEventListener(_type, callback) {
			listener = callback;
		},
	};
	const form = { action: "/sessions" };
	const button = {
		dataset: {
			deleteSessionTemplate: JSON.stringify({ sessionId: 42 }),
		},
	};

	initializeDeleteSessionForm(root, form);
	listener({ target: { closest: () => button } });

	assert.equal(form.action, "/sessions/42?_method=DELETE");
});

test("exercise discovery retains a base match but exposes only qualifying variants", () => {
	const exercise = {
		baseSearchText: "Squat knee dominant Quadriceps",
		baseFilters: { movement: ["Squat"], muscle: ["Quadriceps"] },
		variants: [
			{
				searchText: "Barbell back squat gym safety arms global",
				filters: {
					equipment: ["Barbell"],
					environment: ["Gym"],
					scope: ["Global"],
				},
			},
			{
				searchText: "Tempo goblet squat home controlled private",
				filters: {
					equipment: ["Dumbbell"],
					environment: ["Home"],
					scope: ["Private"],
				},
			},
		],
	};

	assert.deepEqual(
		evaluateExerciseItem(exercise, {
			query: "tempo goblet",
			baseFilters: { movement: "squat" },
			variantFilters: { scope: "private" },
		}),
		{ matches: true, visibleVariantIndexes: [1] },
	);
	assert.deepEqual(
		evaluateExerciseItem(exercise, {
			query: "quadriceps",
			baseFilters: {},
			variantFilters: { environment: "gym" },
		}),
		{ matches: true, visibleVariantIndexes: [0] },
	);
	assert.deepEqual(
		evaluateExerciseItem(exercise, {
			query: "tempo goblet",
			baseFilters: { muscle: "hamstrings" },
			variantFilters: {},
		}),
		{ matches: false, visibleVariantIndexes: [] },
	);
});

function createField({ value = "", dataset = {} } = {}) {
	const listeners = {};
	return {
		value,
		dataset,
		disabled: false,
		focused: false,
		listeners,
		addEventListener(type, listener) {
			listeners[type] = listener;
		},
		focus() {
			this.focused = true;
		},
	};
}

function createSessionSection() {
	const query = createField();
	const movement = createField({
		dataset: { libraryFilter: "movement", filterLevel: "base" },
	});
	const clear = createField();
	clear.disabled = true;
	const count = { textContent: "2 sessions" };
	const empty = { hidden: true };
	const items = [
		{
			dataset: {
				searchKeyWord: "Lower strength squat barbell",
				filterValues: JSON.stringify({ movement: ["Squat"] }),
			},
			hidden: false,
		},
		{
			dataset: {
				searchKeyWord: "Upper strength press dumbbell",
				filterValues: JSON.stringify({ movement: ["Push"] }),
			},
			hidden: false,
		},
	];

	return {
		dataset: { libraryDiscoverySection: "sessions" },
		query,
		movement,
		clear,
		count,
		empty,
		items,
		querySelector(selector) {
			return {
				"[data-library-query]": query,
				"[data-library-clear]": clear,
				"[data-library-result-count]": count,
				"[data-library-filter-empty]": empty,
			}[selector];
		},
		querySelectorAll(selector) {
			if (selector === "[data-library-filter]") return [movement];
			if (selector === "[data-search-session-item]") return items;
			return [];
		},
	};
}

test("section initialization keeps filters independent and clear restores results", () => {
	const first = createSessionSection();
	const second = createSessionSection();
	initializeSearchAndFiltering({
		querySelectorAll: () => [first, second],
	});

	first.query.value = "lower";
	first.query.listeners.input();
	assert.equal(first.items[0].hidden, false);
	assert.equal(first.items[1].hidden, true);
	assert.equal(first.count.textContent, "1 of 2 sessions");
	assert.equal(first.clear.disabled, false);
	assert.equal(second.count.textContent, "2 sessions");

	first.query.value = "missing";
	first.query.listeners.input();
	assert.equal(first.empty.hidden, false);

	first.clear.listeners.click();
	assert.equal(
		first.items.every((item) => !item.hidden),
		true,
	);
	assert.equal(first.count.textContent, "2 sessions");
	assert.equal(first.empty.hidden, true);
	assert.equal(first.clear.disabled, true);
	assert.equal(first.query.focused, true);
});

function createExerciseItem({ baseSearch, movement, variants }) {
	const count = { textContent: `${variants.length} variants` };
	const resultCount = { textContent: `${variants.length} total` };
	return {
		dataset: {
			baseSearchKeyWord: baseSearch,
			filterValues: JSON.stringify({ movement: [movement] }),
		},
		hidden: false,
		variants,
		count,
		resultCount,
		querySelector(selector) {
			return selector === "[data-exercise-variant-count]" ? count : resultCount;
		},
		querySelectorAll: () => variants,
	};
}

function createVariant(searchText, equipment) {
	return {
		dataset: {
			searchKeyWord: searchText,
			filterValues: JSON.stringify({ equipment: [equipment] }),
		},
		hidden: false,
	};
}

test("exercise-only initialization updates base and nested variant results", () => {
	const query = createField();
	const equipment = createField({
		dataset: { libraryFilter: "equipment", filterLevel: "variant" },
	});
	const clear = createField();
	clear.disabled = true;
	const count = { textContent: "2 exercises · 3 variants" };
	const empty = { hidden: true };
	const items = [
		createExerciseItem({
			baseSearch: "Squat Quadriceps",
			movement: "Squat",
			variants: [
				createVariant("Back squat barbell", "Barbell"),
				createVariant("Goblet squat dumbbell", "Dumbbell"),
			],
		}),
		createExerciseItem({
			baseSearch: "Press Chest",
			movement: "Push",
			variants: [createVariant("Push-up bodyweight", "Bodyweight")],
		}),
	];
	const section = {
		dataset: { libraryDiscoverySection: "exercises" },
		querySelector(selector) {
			return {
				"[data-library-query]": query,
				"[data-library-clear]": clear,
				"[data-library-result-count]": count,
				"[data-library-filter-empty]": empty,
			}[selector];
		},
		querySelectorAll(selector) {
			if (selector === "[data-library-filter]") return [equipment];
			if (selector === "[data-search-exercise-item]") return items;
			return [];
		},
	};

	initializeSearchAndFiltering({ querySelectorAll: () => [section] });
	query.value = "squat";
	equipment.value = "dumbbell";
	equipment.listeners.change();

	assert.equal(items[0].hidden, false);
	assert.deepEqual(
		items[0].variants.map((variant) => variant.hidden),
		[true, false],
	);
	assert.equal(items[1].hidden, true);
	assert.equal(items[0].count.textContent, "1 of 2 variants");
	assert.equal(items[0].resultCount.textContent, "1 shown · 2 total");
	assert.equal(count.textContent, "1 of 2 exercises · 1 of 3 variants");

	query.value = "missing";
	query.listeners.input();
	assert.equal(empty.hidden, false);

	clear.listeners.click();
	assert.equal(count.textContent, "2 exercises · 3 variants");
	assert.equal(
		items.every((item) => !item.hidden),
		true,
	);
	assert.equal(
		items.flatMap((item) => item.variants).every((item) => !item.hidden),
		true,
	);
	assert.equal(items[0].resultCount.textContent, "2 total");
});

test("variant form resolves its role-specific action before submission", () => {
	let onSubmit;
	const form = {
		action: "",
		dataset: { actionPrefix: "/admin/library/exercises" },
		elements: { namedItem: () => ({ value: "12" }) },
		addEventListener(_type, listener) {
			onSubmit = listener;
		},
	};

	initializeVariantCreateForm(form);
	onSubmit();

	assert.equal(form.action, "/admin/library/exercises/12/variants");
});

test("library exercise styles use semantic, responsive, focus, and motion contracts", () => {
	const css = fs.readFileSync(
		new URL("../../../css/components/exerciseTemplates.css", import.meta.url),
		"utf8",
	);

	assert.match(css, /\.exercise-template\.shared-accordion/);
	assert.match(css, /\.exercise-template__trigger:focus-visible/);
	assert.match(css, /\.exercise-template__panel\[hidden\]\s*\{\s*display: none;/);
	assert.match(css, /\.exercise-variants\s*\{/);
	assert.match(css, /\.exercise-variant__actions/);
	assert.match(css, /@container application-content \(max-width: 45rem\)/);
	assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
	assert.doesNotMatch(css, /--template-|#[\da-f]{3,8}|rgb\(/i);

	const discoveryCss = fs.readFileSync(
		new URL("../../../css/components/librarySearch.css", import.meta.url),
		"utf8",
	);
	const pageCss = fs.readFileSync(
		new URL("../../../css/pages/library.css", import.meta.url),
		"utf8",
	);
	assert.match(discoveryCss, /\.library-discovery-controls\s*\{/);
	assert.match(discoveryCss, /\.library-search-input:focus-within/);
	assert.match(discoveryCss, /\.library-filter-empty\[hidden\]/);
	assert.match(discoveryCss, /@container application-content \(max-width: 42rem\)/);
	assert.match(discoveryCss, /@media \(prefers-reduced-motion: reduce\)/);
	assert.match(pageCss, /\.library-discovery__tabs \[data-tab\]:focus-visible/);
	assert.match(pageCss, /\[data-tab\]\[aria-selected="true"\]/);
	assert.match(pageCss, /\.library-discovery__panel:not\(\[hidden\]\)/);
	assert.match(
		pageCss,
		/\.library-variant-form\s*\{[^}]*container-type:\s*inline-size/,
	);
	assert.match(
		pageCss,
		/\.library-variant-form > \.form-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/,
	);
	assert.match(
		pageCss,
		/@container \(min-width: 40rem\)[\s\S]*\.library-variant-form > \.form-grid[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/,
	);
	assert.doesNotMatch(
		pageCss,
		/\.library-variant-form > \.form-grid\s*\{[^}]*repeat\(2/,
	);
});

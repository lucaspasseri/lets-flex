import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { initializeSearchAndFiltering } from "./searchAndFiltering.js";
import { initializeVariantCreateForm } from "./configureVariantCreateForm.js";

test("catalog search works when the admin page has no session workspace", () => {
	let onInput;
	const searchInput = {
		addEventListener(_type, listener) {
			onInput = listener;
		},
	};
	const exerciseCount = { textContent: "2 VARIANTS" };
	const exerciseItems = [
		{ dataset: { searchKeyWord: "Back squat" }, hidden: false, matches: () => true },
		{ dataset: { searchKeyWord: "Bench press" }, hidden: false, matches: () => true },
	];
	const root = {
		querySelector(selector) {
			if (selector === "[data-library-search]") return searchInput;
			if (selector === ".exercise-templates__count") return exerciseCount;
			return null;
		},
		querySelectorAll(selector) {
			return selector === "[data-search-exercise-item]" ? exerciseItems : [];
		},
	};

	initializeSearchAndFiltering(root);
	onInput({ target: { value: " squat " } });

	assert.equal(exerciseItems[0].hidden, false);
	assert.equal(exerciseItems[1].hidden, true);
	assert.equal(exerciseCount.textContent, "1 VARIANT");
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
	assert.match(css, /@media \(max-width: 45rem\)/);
	assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
	assert.doesNotMatch(css, /--template-|#[\da-f]{3,8}|rgb\(/i);
});

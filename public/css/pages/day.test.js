import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dayStylesheet = new URL("./day.css", import.meta.url);
const libraryStylesheet = new URL("./library.css", import.meta.url);
const mainStylesheet = new URL("../main.css", import.meta.url);

test("training-day and contextual Library styles preserve hierarchy, actions, and responsive behavior", async () => {
	const [dayCss, libraryCss, mainCss] = await Promise.all([
		readFile(dayStylesheet, "utf8"),
		readFile(libraryStylesheet, "utf8"),
		readFile(mainStylesheet, "utf8"),
	]);

	assert.match(mainCss, /@import url\("\.\/pages\/day\.css"\)/);
	assert.match(mainCss, /@import url\("\.\/pages\/library\.css"\)/);
	assert.match(dayCss, /\.day-context-path/);
	assert.match(dayCss, /\.day-page > \.workout-feedback\s*{[\s\S]*?margin: 0/);
	assert.match(dayCss, /\.day-panel__create-link:focus-visible/);
	assert.match(dayCss, /\.day-panel__create-link--primary/);
	assert.match(
		dayCss,
		/@media \(max-width: 52rem\)[\s\S]*?\.day-page__content\s*{[\s\S]*?grid-template-columns: 1fr/,
	);
	assert.match(dayCss, /\.workout-card__media\s*\{/);
	assert.match(dayCss, /\.workout-step__media\s*\{/);
	assert.match(dayCss, /\.workout-card__heading\s*\{[^}]*min-width:\s*0/);
	assert.match(dayCss, /\.workout-card__title\s*\{[^}]*overflow-wrap:\s*anywhere/);
	assert.doesNotMatch(dayCss, /\.workout-card__media[^}]*object-fit/);
	assert.doesNotMatch(dayCss, /\.workout-step__media[^}]*object-fit/);
	assert.doesNotMatch(dayCss, /\.workout-step__media\.media-frame--initial/);
	assert.match(
		dayCss,
		/@media \(max-width: 30rem\)[\s\S]*?\.workout-step__media[\s\S]*?grid-row: 1/,
	);
	assert.match(dayCss, /@media \(prefers-reduced-motion: reduce\)/);
	assert.match(libraryCss, /\.library-planning-context/);
	assert.match(libraryCss, /\.session-form-context/);
	assert.match(
		libraryCss,
		/@container application-content \(max-width: 42rem\)[\s\S]*?\.library-planning-context\s*{[\s\S]*?grid-template-columns: auto minmax\(0, 1fr\)/,
	);
});

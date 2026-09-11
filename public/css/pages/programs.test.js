import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheetPath = new URL("./programs.css", import.meta.url);
const mainStylesheetPath = new URL("../main.css", import.meta.url);

test("Programs presentation loads hierarchy, readable cards, and responsive contracts", async () => {
	const [programsCss, mainCss] = await Promise.all([
		readFile(stylesheetPath, "utf8"),
		readFile(mainStylesheetPath, "utf8"),
	]);

	assert.match(mainCss, /@import url\("\.\/pages\/programs\.css"\)/);
	assert.match(programsCss, /\.program-hierarchy__list/);
	assert.match(programsCss, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
	assert.match(
		programsCss,
		/\.entity-switcher__list\s*{[\s\S]*?minmax\(min\(18rem, 100%\), 22rem\)/,
	);
	assert.match(programsCss, /\.entity-card\s*{[\s\S]*?min-height: 9rem/);
	assert.match(programsCss, /\.entity-card__name\s*{[\s\S]*?overflow-wrap: anywhere/);
	assert.match(programsCss, /\.entity-card__meta\s*{[\s\S]*?overflow-wrap: anywhere/);
	assert.doesNotMatch(
		programsCss,
		/\.entity-card__(?:name|meta)\s*{[^}]*text-overflow:\s*ellipsis/,
	);
	assert.match(programsCss, /@container application-content \(max-width: 58rem\)/);
	assert.match(
		programsCss,
		/@container application-content \(max-width: 58rem\)[\s\S]*?\.program-hierarchy__item:not\(:last-child\)::after\s*{[\s\S]*?display: none/,
	);
	assert.match(programsCss, /@container application-content \(max-width: 48rem\)/);
	assert.match(programsCss, /@container application-content \(max-width: 28rem\)/);
	assert.match(programsCss, /@media \(prefers-reduced-motion: reduce\)/);
	assert.match(programsCss, /flex: 0 0 clamp\(16\.5rem, 82vw, 20rem\)/);
	assert.match(programsCss, /overflow-x: auto/);
	assert.match(programsCss, /\.entity-card__select:focus-visible/);
});

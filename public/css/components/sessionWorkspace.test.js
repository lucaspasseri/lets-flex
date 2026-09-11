import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheetPath = new URL("./sessionWorkspace.css", import.meta.url);

test("selected-session detail uses a contained responsive reading-flow contract", async () => {
	const css = await readFile(stylesheetPath, "utf8");

	assert.match(css, /\.session-details\s*\{[^}]*container-type:\s*inline-size/);
	assert.match(
		css,
		/\.session-stats\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
	);
	assert.match(
		css,
		/@container \(min-width: 38rem\)[\s\S]*?\.session-stats\s*\{[^}]*repeat\(4, minmax\(0, 1fr\)\)/,
	);
	assert.match(
		css,
		/\.session-step\s*\{[^}]*border-top:[^}]*\}[\s\S]*?\.session-step:last-child\s*\{[^}]*border-bottom:/,
	);
	assert.match(
		css,
		/@container application-content \(max-width: 64rem\)[\s\S]*?\.session-summaries__list\s*\{[^}]*max-height:\s*26rem[\s\S]*?\.session-details__back-link\s*\{[^}]*display:\s*inline-flex/,
	);
	assert.match(css, /\.session-summaries__list\s*\{[^}]*overflow-y:\s*auto/);
	assert.match(css, /\.session-summary__name\s*\{[^}]*overflow-wrap:\s*anywhere/);
	assert.match(css, /\.session-details__back-link:focus-visible/);
	assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

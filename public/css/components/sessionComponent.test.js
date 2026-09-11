import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheet = new URL("./sessionComponent.css", import.meta.url);

test("focused workout media preserves readable step and current-exercise layouts", async () => {
	const css = await readFile(stylesheet, "utf8");

	assert.match(css, /\.session-header__media\s*\{/);
	assert.match(css, /\.current-workout-step__media\s*\{/);
	assert.match(css, /\.session-header-text\s*\{[^}]*min-width:\s*0/);
	assert.match(css, /\.session-header-text h2\s*\{[^}]*overflow-wrap:\s*anywhere/);
	assert.match(css, /\.session-step__name\s*\{[^}]*overflow-wrap:\s*anywhere/);
	assert.doesNotMatch(css, /\.current-workout-step__media img/);
	assert.doesNotMatch(css, /\.session-step__media\.media-frame--initial/);
	assert.doesNotMatch(css, /\.session-step__media[^}]*aspect-ratio/);
	assert.match(
		css,
		/@media \(max-width: 32rem\)[\s\S]*?\.session-component \.session-step__media[\s\S]*?grid-row: 1/,
	);
	assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

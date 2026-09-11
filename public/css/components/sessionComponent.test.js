import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheet = new URL("./sessionComponent.css", import.meta.url);

test("focused workout media preserves readable step and current-exercise layouts", async () => {
	const css = await readFile(stylesheet, "utf8");

	assert.match(css, /\.session-header__media\s*\{/);
	assert.match(css, /\.current-workout-step__media\s*\{/);
	assert.match(
		css,
		/\.current-workout-step__media img\s*\{[^}]*aspect-ratio:\s*3 \/ 2/,
	);
	assert.match(
		css,
		/\.session-component \.session-step__media\s*\{[^}]*width:\s*3\.75rem[^}]*height:\s*2\.5rem[^}]*aspect-ratio:\s*3 \/ 2/,
	);
	assert.match(
		css,
		/@media \(max-width: 32rem\)[\s\S]*?\.session-component \.session-step__media[\s\S]*?grid-row: 1/,
	);
	assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

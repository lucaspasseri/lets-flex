import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheetPath = new URL("./tabs.css", import.meta.url);

test("shared tabs expose focus and reduced-motion safeguards", async () => {
	const css = await readFile(stylesheetPath, "utf8");

	assert.match(css, /\[data-tab\]:focus-visible\s*\{[\s\S]*?outline:/);
	assert.match(css, /transition:\s*background-color 160ms ease;/);
	assert.match(
		css,
		/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\[data-tab\]\s*\{[\s\S]*?transition:\s*none;/,
	);
});

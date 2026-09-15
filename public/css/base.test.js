import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheetPath = new URL("./base.css", import.meta.url);
const mainStylesheetPath = new URL("./main.css", import.meta.url);

test("base stylesheet establishes dark first-paint defaults for native controls", async () => {
	const [css, mainCss] = await Promise.all([
		readFile(stylesheetPath, "utf8"),
		readFile(mainStylesheetPath, "utf8"),
	]);

	assert.match(css, /:root\s*\{[^}]*color-scheme:\s*dark;/s);
	assert.match(css, /body\s*\{[^}]*color:\s*var\(--color-text\);[^}]*\}/s);
	assert.match(
		css,
		/button,\s*\ninput,\s*\nselect,\s*\ntextarea\s*\{[\s\S]*?color:\s*var\(--color-text\);[\s\S]*?background-color:\s*var\(--color-page\);[\s\S]*?border:\s*1px solid var\(--color-border\);[\s\S]*?font:\s*inherit;/,
	);
	assert.match(
		css,
		/button:focus-visible,[\s\S]*?textarea:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--color-focus\);/,
	);
	assert.doesNotMatch(mainCss, /@import url\("\.\/base\.css"\)/);
	assert.doesNotMatch(
		mainCss,
		/@import url\("\.\/components\/(?:forms|form|button)\.css"\)/,
	);
});

test("base stylesheet keeps native View Transitions short and progressively enhanced", async () => {
	const css = await readFile(stylesheetPath, "utf8");

	assert.match(css, /@view-transition\s*{[^}]*navigation:\s*auto;/s);
	assert.match(
		css,
		/::view-transition-old\(root\),[\s\S]*?animation-duration:\s*100ms;/,
	);
	assert.match(
		css,
		/@media \(prefers-reduced-motion: reduce\)[\s\S]*?navigation:\s*none;/,
	);
	assert.match(
		css,
		/@media \(prefers-reduced-motion: reduce\)[\s\S]*?::view-transition-new\(\*\)[\s\S]*?animation:\s*none !important;/,
	);
});

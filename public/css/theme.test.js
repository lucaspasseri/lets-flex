import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheetPath = new URL("./theme.css", import.meta.url);
const mainStylesheetPath = new URL("./main.css", import.meta.url);
const pageTemplates = [
	new URL("../../views/index.ejs", import.meta.url),
	new URL("../../views/day.ejs", import.meta.url),
	new URL("../../views/library.ejs", import.meta.url),
];

test("theme stylesheet exposes exactly two semantic token boundaries", async () => {
	const css = await readFile(stylesheetPath, "utf8");

	assert.match(css, /:root,\s*:root\[data-theme="classic"\]/);
	assert.match(css, /:root\[data-theme="neon"\]/);
	for (const token of [
		"color-page",
		"color-surface",
		"color-surface-raised",
		"color-text",
		"color-text-muted",
		"color-border",
		"color-action",
		"color-secondary",
		"color-success",
		"color-danger",
		"focus-ring",
		"surface-shadow",
		"accent-shadow",
		"primary-gradient",
	]) {
		assert.match(css, new RegExp(`--${token}:`));
	}
	assert.match(css, /:root\[data-theme="neon"\][\s\S]*oklch\(82% 0\.19 190\)/);
	assert.match(css, /:root\[data-theme="neon"\][\s\S]*oklch\(78% 0\.2 304\)/);
	assert.doesNotMatch(css, /--neon-[a-z-]+/);
	assert.doesNotMatch(css, /(?:display|position|grid-template|padding|margin|gap):/);
});

test("Neon decoration is shared and experiment page wiring is absent", async () => {
	const [css, mainCss, ...templates] = await Promise.all([
		readFile(stylesheetPath, "utf8"),
		readFile(mainStylesheetPath, "utf8"),
		...pageTemplates.map((path) => readFile(path, "utf8")),
	]);

	assert.match(css, /:root\[data-theme="neon"\] \.shared-button--primary/);
	assert.match(css, /:root\[data-theme="neon"\] \.session-component--in-progress/);
	assert.doesNotMatch(mainCss, /experiments\/boldNeonPerformance\.css/);
	for (const template of templates) {
		assert.doesNotMatch(template, /data-design-direction|bold-neon-performance/);
	}
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheetPath = new URL("./progress.css", import.meta.url);
const mainStylesheetPath = new URL("../main.css", import.meta.url);
const footerStylesheetPath = new URL("../components/footer.css", import.meta.url);

test("progress presentation is loaded with responsive and accessible interaction contracts", async () => {
	const [progressCss, mainCss, footerCss] = await Promise.all([
		readFile(stylesheetPath, "utf8"),
		readFile(mainStylesheetPath, "utf8"),
		readFile(footerStylesheetPath, "utf8"),
	]);

	assert.match(mainCss, /@import url\("\.\/pages\/progress\.css"\)/);
	assert.match(progressCss, /@media \(max-width: 64rem\)/);
	assert.match(progressCss, /@media \(max-width: 48rem\)/);
	assert.match(progressCss, /@media \(max-width: 34rem\)/);
	assert.match(progressCss, /@media \(max-width: 23rem\)/);
	assert.match(progressCss, /@media \(prefers-reduced-motion: reduce\)/);
	assert.match(
		progressCss,
		/\.exercise-progress-table-scroll\s*{[\s\S]*?max-width: 100%;[\s\S]*?overflow-x: auto/,
	);
	assert.match(progressCss, /\.exercise-progress-table-scroll:focus-visible/);
	assert.match(progressCss, /\.exercise-progress-primary-action:focus-visible/);
	assert.match(progressCss, /\.exercise-progress-table-workout a:focus-visible/);
	assert.match(
		progressCss,
		/\.exercise-progress-table-workout a\s*{[\s\S]*?min-height: 2\.75rem/,
	);
	assert.match(progressCss, /min-height: 2\.75rem/);
	assert.match(progressCss, /overflow-wrap: anywhere/);
	assert.match(progressCss, /font-variant-numeric: tabular-nums/);
	assert.match(footerCss, /\.footer-nav\s*{[\s\S]*?overflow-x: auto/);
});

test("progress hierarchy retains non-color unit and coverage markers", async () => {
	const progressCss = await readFile(stylesheetPath, "utf8");

	assert.match(progressCss, /\.exercise-progress-summary-card--primary/);
	assert.match(progressCss, /\.exercise-progress-coverage-list li > span/);
	assert.match(progressCss, /\.exercise-progress-unit-card dt > span/);
	assert.match(progressCss, /border-left: 3px solid var\(--color-action\)/);
});

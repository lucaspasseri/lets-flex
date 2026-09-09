import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheetPath = new URL("./history.css", import.meta.url);
const mainStylesheetPath = new URL("../main.css", import.meta.url);

test("history presentation is loaded and includes responsive accessibility contracts", async () => {
	const [historyCss, mainCss] = await Promise.all([
		readFile(stylesheetPath, "utf8"),
		readFile(mainStylesheetPath, "utf8"),
	]);

	assert.match(mainCss, /@import url\("\.\/pages\/history\.css"\)/);
	assert.match(historyCss, /@media \(max-width: 48rem\)/);
	assert.match(historyCss, /@media \(max-width: 34rem\)/);
	assert.match(historyCss, /@media \(max-width: 23rem\)/);
	assert.match(historyCss, /@media \(prefers-reduced-motion: reduce\)/);
	assert.match(historyCss, /\.history-table-scroll[\s\S]*overflow-x: auto/);
	assert.match(historyCss, /\.history-table-scroll:focus-visible/);
	assert.match(historyCss, /\.history-primary-action:focus-visible/);
	assert.match(historyCss, /min-height: 2\.75rem/);
});

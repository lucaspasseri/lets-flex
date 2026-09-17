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
	assert.match(historyCss, /@container application-content \(max-width: 48rem\)/);
	assert.match(historyCss, /@container application-content \(max-width: 34rem\)/);
	assert.match(historyCss, /@container application-content \(max-width: 23rem\)/);
	assert.match(historyCss, /@media \(prefers-reduced-motion: reduce\)/);
	assert.match(historyCss, /\.history-table-scroll[\s\S]*overflow-x: auto/);
	assert.match(historyCss, /\.history-table-scroll:focus-visible/);
	assert.match(historyCss, /\.history-primary-action:focus-visible/);
	assert.match(historyCss, /min-height: 2\.75rem/);
	assert.match(historyCss, /::view-transition-group\(\.history-session\)/);
	assert.match(historyCss, /animation-duration: 240ms/);
	assert.match(historyCss, /\.workout-history--media-insights \.history-card__media/);
	assert.match(historyCss, /aspect-ratio: 3 \/ 2/);
	assert.match(historyCss, /@container application-content \(min-width: 48rem\)/);
	assert.match(historyCss, /grid-template-columns: 0\.3rem minmax\(7rem, 9rem\)/);
	assert.match(historyCss, /\.history-step__media[\s\S]*?grid-row: 1;/);
	assert.match(historyCss, /\.history-step__content[\s\S]*?grid-column: 1 \/ -1/);
	assert.match(historyCss, /\.history-step \.history-note[\s\S]*?grid-column: 1 \/ -1/);
	assert.doesNotMatch(historyCss, /history-card__media[\s\S]*?min-height:/);
});

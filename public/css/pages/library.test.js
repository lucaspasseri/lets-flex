import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheetPath = new URL("./library.css", import.meta.url);
const exerciseStylesheetPath = new URL(
	"../components/exerciseTemplates.css",
	import.meta.url,
);
const sessionStylesheetPath = new URL(
	"../components/sessionWorkspace.css",
	import.meta.url,
);
const mediaStylesheetPath = new URL("../components/mediaFallback.css", import.meta.url);

test("Library relies on the shared requested-geometry contract without page-local overrides", async () => {
	const [libraryCss, exerciseCss, sessionCss, mediaCss] = await Promise.all([
		readFile(stylesheetPath, "utf8"),
		readFile(exerciseStylesheetPath, "utf8"),
		readFile(sessionStylesheetPath, "utf8"),
		readFile(mediaStylesheetPath, "utf8"),
	]);

	assert.doesNotMatch(
		mediaCss,
		/\.media-frame--initial,[\s\S]*?\.media-frame__initial\s*\{[^}]*(?:^|\n)\s*(?:width|height|aspect-ratio)\s*:/,
	);
	assert.doesNotMatch(libraryCss, /media-frame--initial/);
	assert.doesNotMatch(exerciseCss, /\.exercise-template__media\s*\{[^}]*aspect-ratio/);
	assert.match(
		exerciseCss,
		/\.exercise-variant\s*\{[\s\S]*grid-template-columns:\s*2\.25rem minmax\(0, 1fr\)/,
	);
	assert.doesNotMatch(sessionCss, /\.session-(?:summary|details|step)__media img/);
	assert.doesNotMatch(
		sessionCss,
		/\.session-(?:summary|details|step)__media[\s\S]*aspect-ratio/,
	);
});

test("exercise muscle presentation groups readable items and adapts across available width", async () => {
	const exerciseCss = await readFile(exerciseStylesheetPath, "utf8");

	assert.match(
		exerciseCss,
		/\.exercise-template__muscle-list\s*\{[\s\S]*display:\s*flex[\s\S]*flex-wrap:\s*wrap/,
	);
	assert.match(
		exerciseCss,
		/\.exercise-template__muscle-item\s*\{[\s\S]*display:\s*inline-grid[\s\S]*max-width:\s*100%/,
	);
	assert.match(
		exerciseCss,
		/\.exercise-template__muscle-group \+ \.exercise-template__muscle-group\s*\{[\s\S]*border-top:\s*1px solid var\(--color-border\)/,
	);
	assert.match(
		exerciseCss,
		/\.exercise-template__muscle-copy span\s*\{[\s\S]*color: var\(--color-success\)/,
	);
	assert.match(
		exerciseCss,
		/@container application-content \(max-width: 45rem\)[\s\S]*?\.exercise-template__muscle-group\s*\{[\s\S]*grid-template-columns:\s*1fr/,
	);
});

test("exercise summaries use compact Sessions-like card and state contracts", async () => {
	const [css, sessionCss] = await Promise.all([
		readFile(exerciseStylesheetPath, "utf8"),
		readFile(sessionStylesheetPath, "utf8"),
	]);

	assert.match(css, /\.exercise-template-workspace\s*\{[\s\S]*min-width:\s*0/);
	assert.doesNotMatch(
		css,
		/\.exercise-template__summaries\s*\{[\s\S]*position:\s*static/,
	);
	assert.match(
		sessionCss,
		/\.session-workspace__content\s*\{[\s\S]*grid-template-columns:\s*minmax\(min\(19rem, 100%\), 0\.8fr\) minmax\(0, 1\.6fr\)/,
	);
	assert.match(
		sessionCss,
		/\.session-summaries__list\s*\{[\s\S]*max-height:\s*min\(42rem, calc\(100dvh - 14rem\)\)/,
	);
	assert.match(sessionCss, /\.session-summaries__list\s*\{[\s\S]*overflow-y:\s*auto/);
	assert.match(sessionCss, /\.session-summaries\s*\{[\s\S]*position:\s*sticky/);
	assert.match(
		css,
		/\.exercise-template__summary-trigger\s*\{[\s\S]*width:\s*100%[\s\S]*border:\s*1px solid transparent[\s\S]*background:\s*transparent/,
	);
	assert.match(css, /\.exercise-template__summary-trigger:focus-visible/);
	assert.match(
		css,
		/\.exercise-template__details-panel\[hidden\]\s*\{[\s\S]*display:\s*none/,
	);
	assert.match(
		css,
		/\.exercise-template__details-panel \.exercise-template__content\s*\{[\s\S]*padding:\s*0/,
	);
	assert.match(
		css,
		/@container application-content \(max-width: 45rem\)[\s\S]*?\.exercise-template__summary-trigger\s*\{[\s\S]*padding:\s*0\.8rem/,
	);
	assert.match(
		sessionCss,
		/@container application-content \(max-width: 64rem\)[\s\S]*?\.session-workspace__content\s*\{[\s\S]*grid-template-columns:\s*1fr/,
	);
	assert.doesNotMatch(css, /\.exercise-template\.shared-accordion/);
});

test("selected exercise details use a contained Sessions-like reading flow", async () => {
	const css = await readFile(exerciseStylesheetPath, "utf8");

	assert.match(
		css,
		/\.exercise-template__content\s*\{[\s\S]*min-width:\s*0[\s\S]*padding:\s*clamp\(1rem, 3vw, 1\.25rem\)/,
	);
	assert.match(
		css,
		/\.exercise-template__detail-header\s*\{[\s\S]*grid-template-columns:\s*auto minmax\(0, 1fr\)[\s\S]*gap:\s*1rem[\s\S]*padding-bottom:\s*1rem[\s\S]*border-bottom:\s*1px solid var\(--color-border\)/,
	);
	assert.match(
		css,
		/\.exercise-template__detail-identity\s*\{[\s\S]*display:\s*grid[\s\S]*min-width:\s*0/,
	);
	assert.match(
		css,
		/\.exercise-template__detail-identity h3\s*\{[\s\S]*overflow-wrap:\s*anywhere/,
	);
	assert.match(
		css,
		/\.exercise-template__facts\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
	);
	assert.match(
		css,
		/\.exercise-template__muscles,\s*\.exercise-template__variant-section\s*\{[\s\S]*border-top:\s*1px solid var\(--color-border\)/,
	);
	assert.match(css, /\.exercise-template__actions\s*\{[\s\S]*grid-column:\s*auto/);
	assert.match(css, /\.exercise-variant__actions\s*\{[\s\S]*grid-column:\s*2/);
	assert.match(
		css,
		/@container application-content \(max-width: 45rem\)[\s\S]*?\.exercise-template__detail-description\s*\{[\s\S]*font-size:\s*0\.8rem/,
	);
	assert.match(
		css,
		/@container application-content \(max-width: 34rem\)[\s\S]*?\.exercise-template__detail-header\s*\{[\s\S]*grid-template-columns:\s*1fr/,
	);
});

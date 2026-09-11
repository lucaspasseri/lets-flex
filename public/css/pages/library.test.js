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

test("Library media uses one fixed initial tile contract without image layout rules", async () => {
	const [libraryCss, exerciseCss, sessionCss, mediaCss] = await Promise.all([
		readFile(stylesheetPath, "utf8"),
		readFile(exerciseStylesheetPath, "utf8"),
		readFile(sessionStylesheetPath, "utf8"),
		readFile(mediaStylesheetPath, "utf8"),
	]);

	assert.match(
		mediaCss,
		/\.media-frame--initial,[\s\S]*\.media-frame__initial\s*\{[\s\S]*width:\s*2\.75rem[\s\S]*height:\s*2\.75rem[\s\S]*aspect-ratio:\s*auto/,
	);
	assert.doesNotMatch(libraryCss, /media-frame--initial/);
	assert.doesNotMatch(exerciseCss, /\.exercise-template__media\s*\{[^}]*aspect-ratio/);
	assert.doesNotMatch(sessionCss, /\.session-(?:summary|details|step)__media img/);
	assert.doesNotMatch(
		sessionCss,
		/\.session-(?:summary|details|step)__media[\s\S]*aspect-ratio/,
	);
});

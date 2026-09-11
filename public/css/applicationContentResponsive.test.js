import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheetContracts = [
	["./components/pageHeading.css", ["36rem"]],
	["./pages/programs.css", ["58rem", "48rem", "28rem"]],
	["./pages/history.css", ["48rem", "34rem", "23rem"]],
	["./pages/profile.css", ["48rem", "30rem"]],
	["./pages/library.css", ["56rem", "42rem", "30rem"]],
	["./components/librarySearch.css", ["68rem", "42rem"]],
	["./components/exerciseTemplates.css", ["45rem"]],
	["./components/sessionWorkspace.css", ["64rem", "34rem"]],
	["./pages/dashboard.css", ["62rem", "44rem", "34rem"]],
];

test("pressure-width layouts respond to the authenticated content column", async () => {
	for (const [path, breakpoints] of stylesheetContracts) {
		const css = await readFile(new URL(path, import.meta.url), "utf8");

		for (const breakpoint of breakpoints) {
			assert.match(
				css,
				new RegExp(`@container application-content \\(max-width: ${breakpoint}\\)`),
				`${path} should respond to ${breakpoint} of available application content`,
			);
		}
	}
});

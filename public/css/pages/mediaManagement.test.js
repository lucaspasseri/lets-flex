import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync(new URL("./mediaManagement.css", import.meta.url), "utf8");

test("media management styles preserve preview hierarchy, focus visibility, and responsive forms", () => {
	assert.match(
		css,
		/\.media-management__entity-grid\s*\{[\s\S]*?grid-template-columns:/,
	);
	assert.match(css, /\.media-management__preview\s*\{[\s\S]*?min-height:/);
	assert.match(css, /\.media-management select:focus-visible/);
	assert.match(css, /\.media-management__result-link\s*\{/);
	assert.match(css, /\.media-management__result-link:focus-visible/);
	assert.match(css, /grid-template-columns: repeat\(auto-fit/);
	assert.match(
		css,
		/@media screen and \(width < 760px\)[\s\S]*?media-management__editor-grid/,
	);
	assert.match(
		css,
		/@media screen and \(width < 520px\)[\s\S]*?media-management__localized-fields/,
	);
});

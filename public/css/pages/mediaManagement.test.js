import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync(new URL("./mediaManagement.css", import.meta.url), "utf8");

test("media management styles reflow the selected-editor workspace from available content width", () => {
	assert.match(css, /\.media-management__workspace\s*\{[\s\S]*?display:\s*grid/);
	assert.match(
		css,
		/\.media-management__preview\s*\{[\s\S]*?inline-size:\s*min\(100%, 15rem\)[\s\S]*?block-size:\s*10rem/,
	);
	assert.match(
		css,
		/@container application-content \(min-width: 64rem\)[\s\S]*?\.media-management__workspace[\s\S]*?grid-template-columns:/,
	);
	assert.match(
		css,
		/@container application-content \(max-width: 64rem\)[\s\S]*?\.media-management__workspace--has-selection \.media-management__selection[\s\S]*?order:\s*-1/,
	);
	assert.match(
		css,
		/\.media-management__entity-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(auto-fit, minmax\(min\(100%, 18rem\), 1fr\)\)/,
	);
	assert.match(
		css,
		/\.media-management__editor-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(auto-fit, minmax\(min\(100%, 20rem\), 1fr\)\)/,
	);
	assert.match(
		css,
		/@container application-content \(max-width: 52rem\)[\s\S]*?\.media-management__editor-grid[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
	);
	assert.match(css, /\.media-management__form-actions\s*\{[\s\S]*?flex-wrap:\s*wrap/);
	assert.match(css, /\.media-management__selector\s*\{[\s\S]*?overflow-y:\s*auto/);
	assert.match(
		css,
		/\.media-management__workspace--has-selection \.media-management__selection\s*\{\s*order:\s*-1/,
	);
	assert.match(css, /\.media-management select:focus-visible/);
	assert.match(css, /\.media-management__result-link\s*\{/);
	assert.match(css, /\.media-management__result-link:focus-visible/);
	assert.match(css, /grid-template-columns: repeat\(auto-fit/);
	assert.match(
		css,
		/@container application-content \(max-width: 48rem\)[\s\S]*?media-management__removal/,
	);
	assert.match(
		css,
		/@container application-content \(max-width: 32rem\)[\s\S]*?media-management__localized-fields/,
	);
});

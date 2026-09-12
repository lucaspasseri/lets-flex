import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

const css = fs.readFileSync(
	new URL("./translationMaintenance.css", import.meta.url),
	"utf8",
);

test("translation maintenance styles preserve labelled table overflow and responsive filter layout", () => {
	assert.match(
		css,
		/\.translation-maintenance__table-wrap\s*\{[\s\S]*?overflow-x:\s*auto/,
	);
	assert.match(css, /\.translation-maintenance__table-wrap:focus-visible\s*\{/);
	assert.match(
		css,
		/@media \(width < 54rem\)[\s\S]*?translation-maintenance__filter-fields/,
	);
	assert.match(css, /@media \(width < 36rem\)[\s\S]*?flex-direction: column-reverse/);
	assert.match(
		css,
		/\.translation-maintenance__missing > span\s*\{[\s\S]*?font-weight:/,
	);
	assert.match(
		css,
		/\.translation-maintenance__locale-grid\s*\{[\s\S]*?grid-template-columns: repeat\(2/,
	);
	assert.match(css, /\.translation-maintenance__locale-actions[\s\S]*?width: 100%/);
});

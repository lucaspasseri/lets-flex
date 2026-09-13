import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync(new URL("./pageFeedback.css", import.meta.url), "utf8");

test("page feedback provides an explicit success treatment distinct from errors", () => {
	assert.match(css, /\.page-feedback--success\s*\{/);
	assert.match(css, /\.page-feedback--success \.page-feedback__eyebrow\s*\{/);
	assert.match(css, /border-left-color: var\(--color-accent\)/);
});

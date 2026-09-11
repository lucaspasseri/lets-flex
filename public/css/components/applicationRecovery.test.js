import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("application recovery styles provide a bounded accessible surface", () => {
	const css = fs.readFileSync(
		new URL("./applicationRecovery.css", import.meta.url),
		"utf8",
	);

	assert.match(css, /\.recovery-page\s*\{[\s\S]*?min-height: 100svh/);
	assert.match(css, /\.recovery-panel\s*\{[\s\S]*?width: min\(100%, 38rem\)/);
	assert.match(css, /\.recovery-action\s*\{[\s\S]*?min-height: 2\.75rem/);
	assert.match(css, /\.recovery-action:focus-visible\s*\{/);
	assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
	assert.match(css, /\.recovery-action:hover:not\(:disabled\)[\s\S]*?transform: none/);
});

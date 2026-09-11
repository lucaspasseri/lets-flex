import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheetPath = new URL("./mediaFallback.css", import.meta.url);
const mainStylesheetPath = new URL("../main.css", import.meta.url);

test("failed media has a reserved, readable fallback treatment", async () => {
	const [css, mainCss] = await Promise.all([
		readFile(stylesheetPath, "utf8"),
		readFile(mainStylesheetPath, "utf8"),
	]);

	assert.match(css, /\[data-media-state="error"\]\s*\{[\s\S]*display:\s*grid/);
	assert.match(
		css,
		/figure\[data-media-state="error"\]::after[\s\S]*content: "Media unavailable"/,
	);
	assert.match(mainCss, /@import url\("\.\/components\/mediaFallback\.css"\)/);
});

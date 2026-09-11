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

test("shared media frames expose compact icon, thumbnail, and exercise variants", async () => {
	const css = await readFile(stylesheetPath, "utf8");

	assert.match(css, /\.media-frame\s*\{[\s\S]*aspect-ratio:\s*3 \/ 2/);
	assert.match(
		css,
		/\.media-frame--icon\s*\{[\s\S]*width:\s*2\.75rem[\s\S]*height:\s*2\.75rem[\s\S]*aspect-ratio:\s*1/,
	);
	assert.match(
		css,
		/\.media-frame--thumbnail\s*\{[\s\S]*width:\s*3\.75rem[\s\S]*height:\s*2\.5rem[\s\S]*aspect-ratio:\s*3 \/ 2/,
	);
	assert.match(
		css,
		/\.media-frame--exercise\s*\{[\s\S]*width:\s*min\(100%, 18rem\)[\s\S]*aspect-ratio:\s*3 \/ 2/,
	);
	assert.match(
		css,
		/\.media-frame--initial,[\s\S]*\.media-frame__initial\s*\{[\s\S]*place-items:\s*center/,
	);
	assert.match(
		css,
		/\.media-frame--initial,[\s\S]*\.media-frame__initial\s*\{[\s\S]*width:\s*2\.75rem[\s\S]*height:\s*2\.75rem[\s\S]*aspect-ratio:\s*auto/,
	);
	assert.match(
		css,
		/\.media-frame--initial > span,[\s\S]*width:\s*100%[\s\S]*height:\s*100%/,
	);
	assert.match(
		css,
		/\.media-frame__content\s*\{[\s\S]*width:\s*100%[\s\S]*height:\s*100%/,
	);
});

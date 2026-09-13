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

test("shared media frames keep requested geometry for image and initial presentations", async () => {
	const css = await readFile(stylesheetPath, "utf8");

	assert.match(css, /\.media-frame\s*\{[\s\S]*aspect-ratio:\s*3 \/ 2/);
	assert.match(
		css,
		/\.media-frame:not\(figure\):not\(\.media-frame--initial\):not\(\.media-frame--preview\)\s*,\n\.media-frame__content\s*\{\s*display:\s*block;\s*object-fit:\s*cover;\s*\}/,
	);
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
		/\.media-frame--compact\.media-frame--icon\s*\{[\s\S]*width:\s*2\.25rem[\s\S]*height:\s*2\.25rem/,
	);
	assert.match(
		css,
		/\.media-frame--compact\.media-frame--thumbnail\s*\{[\s\S]*width:\s*3\.25rem[\s\S]*height:\s*2\.1667rem/,
	);
	assert.match(
		css,
		/\.media-frame--exercise\s*\{[\s\S]*width:\s*min\(100%, 18rem\)[\s\S]*aspect-ratio:\s*3 \/ 2/,
	);
	assert.match(
		css,
		/\.media-frame--preview,[\s\S]*?\.media-frame__content\.media-frame--preview\s*\{[\s\S]*width:\s*100%[\s\S]*height:\s*100%[\s\S]*object-fit:\s*contain/,
	);
	assert.match(
		css,
		/\.media-frame--initial,[\s\S]*\.media-frame__initial\s*\{[\s\S]*place-items:\s*center/,
	);
	assert.doesNotMatch(
		css,
		/\.media-frame--initial,[\s\S]*?\.media-frame__initial\s*\{[^}]*(?:^|\n)\s*(?:width|height|aspect-ratio)\s*:/,
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

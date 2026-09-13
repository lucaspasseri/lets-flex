import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheetPath = new URL("./form.css", import.meta.url);

test("dynamic form collection values remain bounded on desktop and readable on narrow layouts", async () => {
	const css = await readFile(stylesheetPath, "utf8");

	assert.match(
		css,
		/\.form-collection__item p\s*\{[\s\S]*min-width:\s*0[\s\S]*text-overflow:\s*ellipsis[\s\S]*white-space:\s*nowrap/,
	);
	assert.match(
		css,
		/@media \(max-width: 38rem\)[\s\S]*?\.form-collection__item p\s*\{[\s\S]*overflow-wrap:\s*anywhere[\s\S]*text-overflow:\s*clip[\s\S]*white-space:\s*normal/,
	);
});

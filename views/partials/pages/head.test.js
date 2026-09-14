import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ejs from "ejs";

const headPath = new URL("./head.ejs", import.meta.url);

test("shared head loads foundational and control styles before the feature stylesheet chain", async () => {
	const [source, head] = await Promise.all([
		readFile(headPath, "utf8"),
		ejs.renderFile(headPath.pathname, { page: { title: "Test" } }),
	]);
	const foundationIndex = head.indexOf('href="/css/base.css"');
	const formsIndex = head.indexOf('href="/css/components/forms.css"');
	const formIndex = head.indexOf('href="/css/components/form.css"');
	const buttonIndex = head.indexOf('href="/css/components/button.css"');
	const featureIndex = head.indexOf('href="/css/main.css"');

	assert.ok(foundationIndex >= 0);
	assert.ok(formsIndex > foundationIndex);
	assert.ok(formIndex > formsIndex);
	assert.ok(buttonIndex > formIndex);
	assert.ok(featureIndex > buttonIndex);
	assert.match(source, /<link rel="stylesheet" href="\/css\/base\.css" \/>/);
});

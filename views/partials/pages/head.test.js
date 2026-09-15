import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import ejs from "ejs";

const headPath = new URL("./head.ejs", import.meta.url);

test("shared head loads foundational and control styles before the feature stylesheet chain", async () => {
	const [source, head] = await Promise.all([
		readFile(headPath, "utf8"),
		ejs.renderFile(headPath.pathname, { page: { title: "Test" } }),
	]);
	const resolverIndex = source.indexOf("<script>");
	const themeIndex = head.indexOf('href="/css/theme.css"');
	const foundationIndex = head.indexOf('href="/css/base.css"');
	const formsIndex = head.indexOf('href="/css/components/forms.css"');
	const formIndex = head.indexOf('href="/css/components/form.css"');
	const buttonIndex = head.indexOf('href="/css/components/button.css"');
	const featureIndex = head.indexOf('href="/css/main.css"');

	assert.ok(resolverIndex >= 0);
	assert.ok(themeIndex > resolverIndex);
	assert.ok(foundationIndex > themeIndex);
	assert.ok(formsIndex > foundationIndex);
	assert.ok(formIndex > formsIndex);
	assert.ok(buttonIndex > formIndex);
	assert.ok(featureIndex > buttonIndex);
	assert.match(source, /<link rel="stylesheet" href="\/css\/base\.css" \/>/);
	assert.match(source, /window\.localStorage\.getItem\(storageKey\)/);
	assert.match(source, /validThemes = new Set\(\["classic", "neon"\]\)/);
});

test("pre-paint resolver defaults safely and accepts only supported stored themes", async () => {
	const source = await readFile(headPath, "utf8");
	const script = source.match(/<script>\s*([\s\S]*?)\s*<\/script>/)?.[1] ?? "";
	if (!script) throw new Error("Expected the pre-paint theme resolver script");

	function resolveTheme(storedTheme, { storageThrows = false } = {}) {
		const documentRef = { documentElement: { dataset: {} } };
		const context = {
			document: documentRef,
			window: {
				localStorage: {
					getItem() {
						if (storageThrows) throw new Error("storage unavailable");
						return storedTheme;
					},
				},
			},
		};
		vm.runInNewContext(script, context);
		return documentRef.documentElement.dataset.theme;
	}

	assert.equal(resolveTheme(null), "classic");
	assert.equal(resolveTheme("neon"), "neon");
	assert.equal(resolveTheme("middle-ground"), "classic");
	assert.equal(resolveTheme("classic"), "classic");
	assert.equal(resolveTheme("neon", { storageThrows: true }), "classic");
});

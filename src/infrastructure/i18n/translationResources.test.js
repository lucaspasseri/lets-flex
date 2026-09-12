import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const localeRoot = new URL("../../../locales/", import.meta.url);

function readCommonResource(locale) {
	return JSON.parse(
		fs.readFileSync(new URL(`${locale}/common.json`, localeRoot), "utf8"),
	);
}

function collectLeafKeys(value, prefix = "", keys = new Set()) {
	for (const [key, child] of Object.entries(value)) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (child && typeof child === "object" && !Array.isArray(child)) {
			collectLeafKeys(child, path, keys);
		} else {
			keys.add(path);
		}
	}
	return keys;
}

test("English and Brazilian Portuguese resources have matching common keys", () => {
	const english = readCommonResource("en");
	const portuguese = readCommonResource("pt-BR");
	const englishKeys = [...collectLeafKeys(english)].sort();
	const portugueseKeys = [...collectLeafKeys(portuguese)].sort();

	assert.deepEqual(portugueseKeys, englishKeys);
	assert.ok(
		englishKeys.every((key) => {
			const segments = key.split(".");
			let current = english;
			for (const segment of segments) current = current[segment];
			return typeof current === "string" && current.trim().length > 0;
		}),
	);
});

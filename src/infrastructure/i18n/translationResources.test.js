import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const localeRoot = new URL("../../../locales/", import.meta.url);
const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));

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

/** @param {string} directory @param {string[]} [files] */
function collectProductionFiles(directory, files = []) {
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const file = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			collectProductionFiles(file, files);
		} else if (/\.(?:js|ejs)$/.test(entry.name) && !entry.name.endsWith(".test.js")) {
			files.push(file);
		}
	}
	return files;
}

function collectProductionTranslationKeys() {
	const keys = new Set();
	for (const directory of ["src", "views", path.join("public", "js")]) {
		for (const file of collectProductionFiles(path.join(repositoryRoot, directory))) {
			const source = fs.readFileSync(file, "utf8");
			for (const pattern of [
				/(?:translate|t|browserMessage)\(\s*["']([A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+)/g,
				/translateCount\(\s*[^,]+,\s*["']([A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]*)+)/g,
			]) {
				for (const match of source.matchAll(pattern)) keys.add(match[1]);
			}
		}
	}
	return keys;
}

/** @param {Set<string>} keys @param {string} key */
function hasTranslationKey(keys, key) {
	return keys.has(key) || (keys.has(`${key}_one`) && keys.has(`${key}_other`));
}

/** @param {any} english @param {any} portuguese @param {string} [prefix] */
function assertResourceShape(english, portuguese, prefix = "common") {
	assert.equal(
		Array.isArray(portuguese),
		Array.isArray(english),
		`${prefix} must use the same object shape in both locales`,
	);
	if (english && typeof english === "object" && !Array.isArray(english)) {
		assert.ok(
			portuguese && typeof portuguese === "object" && !Array.isArray(portuguese),
		);
		assert.deepEqual(
			Object.keys(portuguese).sort(),
			Object.keys(english).sort(),
			`${prefix} must have the same keys in both locales`,
		);
		for (const key of Object.keys(english)) {
			assertResourceShape(english[key], portuguese[key], `${prefix}.${key}`);
		}
		return;
	}
	assert.equal(typeof english, "string", `${prefix} must be a string`);
	assert.equal(typeof portuguese, "string", `${prefix} must be a string`);
	assert.ok(english.trim(), `${prefix} English translation must not be empty`);
	assert.ok(portuguese.trim(), `${prefix} Portuguese translation must not be empty`);
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

test("locale resources preserve a non-empty namespace and value contract", () => {
	const english = readCommonResource("en");
	const portuguese = readCommonResource("pt-BR");
	assertResourceShape(english, portuguese);
});

test("production translation references resolve to locale resources", () => {
	const resources = [readCommonResource("en"), readCommonResource("pt-BR")].map(
		(resource) => collectLeafKeys(resource),
	);
	const missing = [...collectProductionTranslationKeys()]
		.filter((key) => resources.some((keys) => !hasTranslationKey(keys, key)))
		.sort();

	assert.deepEqual(
		missing,
		[],
		"production translation references must exist in both locales",
	);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const authStylesheetPath = new URL("./auth.css", import.meta.url);
const baseStylesheetPath = new URL("../base.css", import.meta.url);
const mainStylesheetPath = new URL("../main.css", import.meta.url);
const tabsStylesheetPath = new URL("../components/tabs.css", import.meta.url);

function readHexVariable(css, name) {
	const match = css.match(new RegExp(`--${name}:\\s*(#[\\da-f]{6})`, "i"));
	assert.ok(match, `Expected --${name} to have a six-digit hex value`);
	return match[1];
}

function relativeLuminance(hex) {
	const channels = hex
		.slice(1)
		.match(/.{2}/g)
		.map((channel) => Number.parseInt(channel, 16) / 255)
		.map((channel) =>
			channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
		);

	return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(firstHex, secondHex) {
	const first = relativeLuminance(firstHex);
	const second = relativeLuminance(secondHex);
	const lighter = Math.max(first, second);
	const darker = Math.min(first, second);

	return (lighter + 0.05) / (darker + 0.05);
}

test("authentication recovery links expose a readable non-color interaction contract", async () => {
	const [authCss, baseCss] = await Promise.all([
		readFile(authStylesheetPath, "utf8"),
		readFile(baseStylesheetPath, "utf8"),
	]);

	assert.match(
		authCss,
		/\.auth-form-link a\s*\{[^}]*display:\s*inline-flex;[^}]*min-height:\s*2\.75rem;[^}]*color:\s*var\(--color-action\);[^}]*text-decoration-line:\s*underline;/,
	);
	assert.match(
		authCss,
		/\.auth-form-link a:hover\s*\{[^}]*color:\s*var\(--color-action-hover\);[^}]*text-decoration-thickness:/,
	);
	assert.match(
		authCss,
		/\.auth-form-link a:active\s*\{[^}]*color:\s*var\(--color-text\);/,
	);
	assert.match(
		authCss,
		/\.auth-form-link a:focus-visible\s*\{[^}]*outline:\s*3px solid[^}]*outline-offset:\s*2px;/,
	);

	const surface = readHexVariable(baseCss, "neutral-900");
	const linkStateColors = [
		readHexVariable(baseCss, "coral-300"),
		readHexVariable(baseCss, "coral-400"),
		readHexVariable(baseCss, "neutral-100"),
	];

	linkStateColors.forEach((color) => {
		assert.ok(contrastRatio(color, surface) >= 4.5);
	});
});

test("authentication panels override generic tab surfaces without changing shared tabs", async () => {
	const [authCss, mainCss, tabsCss] = await Promise.all([
		readFile(authStylesheetPath, "utf8"),
		readFile(mainStylesheetPath, "utf8"),
		readFile(tabsStylesheetPath, "utf8"),
	]);

	assert.ok(
		mainCss.indexOf('@import url("./pages/auth.css")') <
			mainCss.indexOf('@import url("./components/tabs.css")'),
	);
	assert.match(
		authCss,
		/\.auth-actions > \.auth-tab-panel:not\(\[hidden\]\)\s*\{[^}]*display:\s*grid;[^}]*gap:\s*1rem;[^}]*padding:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/,
	);
	assert.match(
		tabsCss,
		/\[data-tab-panel\]:not\(\[hidden\]\)\s*\{[^}]*box-shadow:[^}]*padding:\s*2em;[^}]*background-color:/,
	);
});

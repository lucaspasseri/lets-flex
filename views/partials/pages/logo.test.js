import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ejs from "ejs";

const logoPath = path.resolve("views/partials/pages/logo.ejs");
const logoStylesheetPath = path.resolve("public/css/components/logo.css");
const chromeStylesheetPath = path.resolve(
	"public/css/components/applicationChrome.css",
);
const authStylesheetPath = path.resolve("public/css/pages/auth.css");

test("shared logo preserves its identity with equally enlarged mirrored arms", async () => {
	const html = await ejs.renderFile(logoPath);
	const upperArmPaths = [...html.matchAll(/brand-mark__upper-arm" d="([^"]+)"/g)].map(
		(match) => match[1],
	);
	const forearmPaths = [
		...html.matchAll(/brand-mark__forearm">\s*<path d="([^"]+)"/g),
	].map((match) => match[1]);

	assert.match(html, /viewBox="0 0 240 240"/);
	assert.match(html, /aria-hidden="true" focusable="false"/);
	assert.equal(
		(html.match(/class="brand-mark__arm brand-mark__arm--/g) ?? []).length,
		2,
	);
	assert.match(
		html,
		/brand-mark__arm--blue" transform="translate\(240 0\) scale\(-1 1\)"/,
	);
	assert.deepEqual(upperArmPaths, [
		"M83 106 C68 101 53 105 40 116 L36 128 L41 140 C55 151 70 154 83 147 Z",
		"M83 106 C68 101 53 105 40 116 L36 128 L41 140 C55 151 70 154 83 147 Z",
	]);
	assert.deepEqual(forearmPaths, [
		"M49 111 C36 108 25 109 16 113 L10 109 L5 118 L8 128 L5 138 L10 147 L16 143 C28 147 39 147 49 142 Z",
		"M49 111 C36 108 25 109 16 113 L10 109 L5 118 L8 128 L5 138 L10 147 L16 143 C28 147 39 147 49 142 Z",
	]);
	assert.equal(
		(html.match(/brand-mark__elbow" cx="43" cy="128" r="10\.5"/g) ?? []).length,
		2,
	);
	assert.match(html, /brand-mark__core" cx="120" cy="120" r="63"/);
	assert.match(html, /class="brand-mark__word"[^>]*>FLEX<\/text>/);
	assert.ok(
		html.indexOf("brand-mark__arm--red") < html.indexOf("brand-mark__core"),
		"arms should remain behind the established circular core",
	);
});

test("shared logo styling gives both arms equal prominence and preserves motion preferences", () => {
	const css = fs.readFileSync(logoStylesheetPath, "utf8");

	assert.match(
		css,
		/\.brand-mark__arm\s*{[\s\S]*?fill: rgb\(255 255 255 \/ 7%\);[\s\S]*?stroke-width: 4\.25;/,
	);
	assert.match(
		css,
		/\.brand-mark__arm-detail\s*{[\s\S]*?stroke-width: 2\.4;[\s\S]*?opacity: 0\.82;/,
	);
	assert.match(css, /\.brand-mark__svg\s*{[\s\S]*?overflow: visible;/);
	assert.match(
		css,
		/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.brand-mark__forearm\s*{[\s\S]*?rotate\(90deg\);/,
	);
});

test("responsive chrome and authentication wrappers increase the shared logo without changing layout models", () => {
	const chromeCss = fs.readFileSync(chromeStylesheetPath, "utf8");
	const authCss = fs.readFileSync(authStylesheetPath, "utf8");

	assert.match(
		chromeCss,
		/\.application-shell\s*{[\s\S]*?--application-header-height: 4\.75rem;[\s\S]*?overflow-x: hidden;/,
	);
	assert.match(
		chromeCss,
		/\.page-header__home\s*{[\s\S]*?width: 4rem;[\s\S]*?height: 4rem;/,
	);
	assert.match(
		chromeCss,
		/@media \(min-width: 48rem\)[\s\S]*?\.page-header\s*{[\s\S]*?height: 8\.25rem;[\s\S]*?\.page-header__home\s*{[\s\S]*?width: 6\.5rem;[\s\S]*?height: 6\.5rem;/,
	);
	assert.match(
		chromeCss,
		/@media \(min-width: 48rem\) and \(max-height: 46\.875rem\)[\s\S]*?\.page-header\s*{[\s\S]*?height: 5\.75rem;[\s\S]*?\.page-header__home\s*{[\s\S]*?width: 4\.75rem;[\s\S]*?height: 4\.75rem;/,
	);
	assert.match(
		authCss,
		/\.auth-introduction__logo\s*{[\s\S]*?width: 4\.25rem;[\s\S]*?height: 4\.25rem;/,
	);
	assert.doesNotMatch(
		chromeCss,
		/margin-(?:left|inline-start):\s*var\(--application-rail-width\)/,
	);
});

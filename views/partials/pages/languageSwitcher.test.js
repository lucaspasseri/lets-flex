import assert from "node:assert/strict";
import test from "node:test";
import ejs from "ejs";
import path from "node:path";
import { i18n } from "../../../src/infrastructure/i18n/i18n.js";

const switcherPath = path.resolve("views/partials/pages/languageSwitcher.ejs");
const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
	ejs.renderFile
);

test("language switcher exposes both canonical locales and the active state", async () => {
	const html = await renderFile(switcherPath, {
		language: "pt-BR",
		t: i18n.getFixedT("pt-BR"),
		csrfToken: "test-token",
		page: { url: "/library?sessionId=4" },
	});

	assert.match(html, /aria-labelledby="language-switcher-label"/);
	assert.match(html, />Idioma<\/p>/);
	assert.match(html, /name="locale" value="en"/);
	assert.match(html, /name="locale" value="pt-BR"/);
	assert.doesNotMatch(html, /name="returnTo"/);
	assert.match(
		html,
		/class="language-switcher__option is-current"[\s\S]*?aria-pressed="true"/,
	);
	assert.match(html, /Português/);
	assert.match(html, /\(atual\)/);
});

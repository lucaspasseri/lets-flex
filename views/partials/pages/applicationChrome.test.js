import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ejs from "ejs";
import { i18n } from "../../../src/infrastructure/i18n/i18n.js";

const chromePath = path.resolve("views/partials/pages/applicationChrome.ejs");
const layoutPath = path.resolve("views/layouts/pageShell.ejs");
const stylesheetPath = path.resolve("public/css/components/applicationChrome.css");
const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
	ejs.renderFile
);

test("application chrome exposes one controlled navigation surface", async () => {
	const html = await renderFile(chromePath, {
		shell: {
			currentUser: { name: "Lucas & Maria", role: "member" },
			activeNavigation: "dashboard",
		},
	});

	assert.match(html, /<header class="page-header">/);
	assert.match(html, /<button[\s\S]*?type="button"/);
	assert.match(html, /aria-label="Open navigation menu"/);
	assert.match(html, /aria-expanded="false"/);
	assert.match(html, /aria-controls="application-menu"/);
	assert.match(
		html,
		/<div[\s\S]*?id="application-menu"[\s\S]*?aria-hidden="true"[\s\S]*?inert/,
	);
	assert.equal((html.match(/<nav class="primary-navigation"/g) ?? []).length, 1);
	assert.equal((html.match(/class="primary-navigation__link"/g) ?? []).length, 5);
	assert.equal((html.match(/action="\/locale"/g) ?? []).length, 2);
	assert.match(html, /aria-labelledby="language-switcher-label"/);
	assert.match(html, /aria-pressed="true"/);
	assert.equal((html.match(/href="\/profile"/g) ?? []).length, 1);
	assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
	assert.match(
		html,
		/href="\/"[\s\S]*?aria-current="page"[\s\S]*?data-application-navigation-link/,
	);
	assert.match(html, /aria-label="View profile for Lucas &amp; Maria"/);
	assert.match(html, /class="application-chrome__username">Lucas &amp; Maria<\/span>/);
});

test("profile is the single lower account destination and owns its active state", async () => {
	const html = await renderFile(chromePath, {
		shell: {
			currentUser: { name: "Guest 104", role: "guest" },
			activeNavigation: "profile",
		},
	});

	assert.equal((html.match(/href="\/profile"/g) ?? []).length, 1);
	assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
	assert.match(
		html,
		/class="application-chrome__profile"[\s\S]*?href="\/profile"[\s\S]*?aria-current="page"/,
	);
	assert.match(html, /Temporary workspace/);
});

test("administrator navigation remains permission-scoped and active", async () => {
	const adminHtml = await renderFile(chromePath, {
		isAdmin: true,
		shell: {
			currentUser: { name: "Administrator", role: "admin" },
			activeNavigation: "admin-exercises",
		},
	});
	const memberHtml = await renderFile(chromePath, {
		isAdmin: false,
		shell: {
			currentUser: { name: "Member", role: "member" },
			activeNavigation: "library",
		},
	});

	assert.equal((adminHtml.match(/class="primary-navigation__link"/g) ?? []).length, 7);
	assert.match(
		adminHtml,
		/href="\/admin\/library\/exercises"[\s\S]*?aria-current="page"/,
	);
	assert.doesNotMatch(memberHtml, /\/admin\/translations/);
	assert.doesNotMatch(memberHtml, /\/admin\/library\/exercises/);
	assert.equal((memberHtml.match(/aria-current="page"/g) ?? []).length, 1);
});

test("application chrome localizes navigation and menu accessibility labels", async () => {
	const html = await renderFile(chromePath, {
		language: "pt-BR",
		t: i18n.getFixedT("pt-BR"),
		shell: {
			currentUser: { name: "Membro", role: "member" },
			activeNavigation: "library",
		},
	});

	assert.match(html, /aria-label="Principal"/);
	assert.match(html, />Painel</);
	assert.match(html, />Biblioteca</);
	assert.match(html, /data-open-label="Abrir menu de navegação"/);
	assert.match(html, /data-close-label="Fechar menu de navegação"/);
});

test("authenticated layout composes chrome, content, and overlays once", () => {
	const layout = fs.readFileSync(layoutPath, "utf8");

	assert.equal((layout.match(/partials\/pages\/applicationChrome/g) ?? []).length, 1);
	assert.match(layout, /<body class="application-shell">/);
	assert.match(layout, /class="content" data-page-content/);
	assert.match(layout, /class="overlays"/);
	assert.doesNotMatch(layout, /partials\/pages\/(header|footer)/);
});

test("chrome styles keep closed navigation inert-compatible without display animation", () => {
	const css = fs.readFileSync(stylesheetPath, "utf8");

	assert.match(css, /\.application-menu\s*{[\s\S]*?position: fixed;/);
	assert.match(
		css,
		/\.application-menu\s*{[\s\S]*?opacity 220ms ease,[\s\S]*?transform 240ms cubic-bezier/,
	);
	assert.match(css, /\.application-menu\.is-open\s*{[\s\S]*?visibility: visible;/);
	assert.match(css, /@media \(min-width: 48rem\)/);
	assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
	assert.match(css, /\.language-switcher__option:focus-visible/);
	assert.doesNotMatch(css, /transition:\s*all/);
});

test("chrome styles reserve one fixed responsive rail without offset margins", () => {
	const css = fs.readFileSync(stylesheetPath, "utf8");
	assert.match(
		css,
		/\.application-shell > \.content\s*\{[^}]*container-name: application-content;[^}]*container-type: inline-size;/,
	);

	assert.match(
		css,
		/@media \(min-width: 48rem\)[\s\S]*?--application-rail-width: 16\.25rem;/,
	);
	assert.match(
		css,
		/\.application-shell > \.application-chrome\s*{[\s\S]*?position: fixed;[\s\S]*?width: var\(--application-rail-width\);[\s\S]*?overflow: hidden;/,
	);
	assert.match(
		css,
		/\.application-shell > \.content\s*{[\s\S]*?grid-column: 2;[\s\S]*?width: 100%;[\s\S]*?min-width: 0;/,
	);
	assert.match(
		css,
		/@media \(min-width: 75rem\)[\s\S]*?--application-rail-width: 21\.875rem;/,
	);
	assert.doesNotMatch(
		css,
		/\.application-shell > \.content\s*{[^}]*margin-(?:left|inline-start)/,
	);
});

test("chrome styles provide mobile morph, short-height scrolling, and reduced motion", () => {
	const css = fs.readFileSync(stylesheetPath, "utf8");

	assert.match(
		css,
		/\.page-header__menu-toggle\[aria-expanded="true"\][\s\S]*?rotate\(45deg\)/,
	);
	assert.match(
		css,
		/@media \(min-width: 48rem\) and \(max-height: 46\.875rem\)[\s\S]*?align-content: start;/,
	);
	assert.match(
		css,
		/@media \(min-width: 48rem\)[\s\S]*?\.application-menu\s*{[\s\S]*?overflow-y: auto;[\s\S]*?scrollbar-gutter: stable;/,
	);
	assert.match(
		css,
		/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.page-header__menu-icon > span,[\s\S]*?transition: none;/,
	);
	assert.doesNotMatch(css, /transition:\s*all/);
});

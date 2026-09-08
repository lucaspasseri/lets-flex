import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ejs from "ejs";

const footerPath = path.resolve("views/partials/pages/footer.ejs");
const destinations = [
	"dashboard",
	"history",
	"progress",
	"programs",
	"library",
	"profile",
];
const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
	ejs.renderFile
);

test("footer identifies exactly one current primary navigation destination", async () => {
	for (const activeNavigation of destinations) {
		const html = await renderFile(footerPath, {
			shell: { activeNavigation },
		});

		assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
		assert.match(html, /<nav class="footer-nav" aria-label="Primary">/);

		const expectedHref =
			activeNavigation === "dashboard" ? "/" : `/${activeNavigation}`;
		assert.match(
			html,
			new RegExp(`href="${expectedHref}"[\\s\\S]*?aria-current="page"`),
		);
	}
});

test("footer has no false current destination when its contract is absent", async () => {
	const html = await renderFile(footerPath, {});

	assert.doesNotMatch(html, /aria-current="page"/);
	assert.equal((html.match(/class="footer-nav__link"/g) ?? []).length, 6);
});

test("footer exposes and identifies the administrator catalog only for admins", async () => {
	const adminHtml = await renderFile(footerPath, {
		isAdmin: true,
		shell: { activeNavigation: "admin-exercises" },
	});
	const memberHtml = await renderFile(footerPath, {
		isAdmin: false,
		shell: { activeNavigation: "library" },
	});

	assert.equal((adminHtml.match(/class="footer-nav__link"/g) ?? []).length, 7);
	assert.match(
		adminHtml,
		/href="\/admin\/library\/exercises"[\s\S]*?aria-current="page"/,
	);
	assert.match(adminHtml, /footer-nav__list--admin/);
	assert.doesNotMatch(memberHtml, /\/admin\/library\/exercises/);
});

test("scrollable mobile navigation does not widen the application shell", () => {
	const css = fs.readFileSync(
		new URL("../../../public/css/components/footer.css", import.meta.url),
		"utf8",
	);

	assert.match(css, /\.footer\s*\{[\s\S]*?min-width: 0;/);
	assert.match(
		css,
		/@media \(max-width: 34rem\)[\s\S]*?\.footer-nav[\s\S]*?overflow-x: auto;/,
	);
});

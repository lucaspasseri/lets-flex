import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import ejs from "ejs";

const footerPath = path.resolve("views/partials/pages/footer.ejs");
const destinations = ["dashboard", "programs", "library", "profile"];
const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (ejs.renderFile);

test("footer identifies exactly one current primary navigation destination", async () => {
	for (const activeNavigation of destinations) {
		const html = await renderFile(footerPath, {
			shell: { activeNavigation },
		});

		assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
		assert.match(html, /<nav class="footer-nav" aria-label="Primary">/);

		const expectedHref = activeNavigation === "dashboard"
			? "/"
			: `/${activeNavigation}`;
		assert.match(
			html,
			new RegExp(`href="${expectedHref}"[\\s\\S]*?aria-current="page"`),
		);
	}
});

test("footer has no false current destination when its contract is absent", async () => {
	const html = await renderFile(footerPath, {});

	assert.doesNotMatch(html, /aria-current="page"/);
	assert.equal((html.match(/class="footer-nav__link"/g) ?? []).length, 4);
});

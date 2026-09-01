import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import ejs from "ejs";

const headerPath = path.resolve("views/partials/pages/header.ejs");
const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
	ejs.renderFile
);

test("header links a named user to their profile", async () => {
	const html = await renderFile(headerPath, {
		shell: { currentUser: { name: "Lucas & Maria" } },
	});

	assert.match(html, /href="\/profile"/);
	assert.match(html, /aria-label="View profile for Lucas &amp; Maria"/);
	assert.match(html, /class="page-header__username">Lucas &amp; Maria<\/span>/);
	assert.match(html, /aria-hidden="true"/);
	assert.match(html, /focusable="false"/);
	assert.doesNotMatch(html, /data-modal-open|appState|resetUserSessionModalId/);
});

test("header identifies a temporary guest workspace", async () => {
	const html = await renderFile(headerPath, {
		shell: { currentUser: { name: "Guest 104", role: "guest" } },
	});

	assert.match(html, /aria-label="View profile for Guest 104"/);
	assert.match(html, /class="page-header__username">Guest 104<\/span>/);
	assert.match(html, /class="page-header__status">Temporary workspace<\/span>/);
	assert.match(html, /href="\/" aria-label="Let's Flex home"/);
});

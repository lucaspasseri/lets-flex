import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import ejs from "ejs";

const headerPath = path.resolve("views/partials/pages/header.ejs");
const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
	ejs.renderFile
);

test("header links a named user to predictable profile selection", async () => {
	const html = await renderFile(headerPath, {
		shell: { currentUser: { name: "Lucas & Maria" } },
	});

	assert.match(html, /href="\/profile"/);
	assert.match(
		html,
		/aria-label="Choose profile\. Current profile: Lucas &amp; Maria"/,
	);
	assert.match(html, /class="page-header__username">Lucas &amp; Maria<\/span>/);
	assert.match(html, /aria-hidden="true"/);
	assert.match(html, /focusable="false"/);
	assert.doesNotMatch(html, /data-modal-open|appState|resetUserSessionModalId/);
});

test("header presents an explicit guest profile action", async () => {
	const html = await renderFile(headerPath, {
		appState: { user: { name: "Legacy user" } },
	});

	assert.match(html, /aria-label="Choose a profile"/);
	assert.match(html, /class="page-header__username">Guest<\/span>/);
	assert.match(html, /href="\/" aria-label="Let's Flex home"/);
	assert.doesNotMatch(html, /Legacy user/);
});

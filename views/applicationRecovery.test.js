import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import ejs from "ejs";

const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
	ejs.renderFile
);

test("application recovery view preserves generic copy and safe navigation", async () => {
	const html = await renderFile(path.resolve("views/application-recovery.ejs"), {
		recovery: {
			eyebrow: "Request not verified",
			title: "We couldn't verify that request",
			message: "Please return to the page and try again.",
			actionLabel: "Return to dashboard",
			actionHref: "/",
		},
	});

	assert.match(html, /<main class="recovery-page">/);
	assert.match(
		html,
		/<section class="recovery-panel" aria-labelledby="recovery-title">/,
	);
	assert.match(
		html,
		/<h1 id="recovery-title">We couldn&#39;t verify that request<\/h1>/,
	);
	assert.match(html, /href="\/"/);
	assert.match(html, /Return to dashboard/);
	assert.doesNotMatch(html, /stack|database|token|secret/i);
});

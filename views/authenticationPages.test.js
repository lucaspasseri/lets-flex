import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import ejs from "ejs";

const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
	ejs.renderFile
);

test("login explains the application and presents both authentication paths", async () => {
	const html = await renderFile(path.resolve("views/login.ejs"), {
		csrfToken: "test-token",
		returnTo: "/library",
		email: "member@example.com",
		errors: [],
	});

	assert.match(html, /Your training workspace/);
	assert.match(html, /action="\/auth\/login"/);
	assert.match(html, /action="\/auth\/guest"/);
	assert.match(html, /Guest data expires after 15 days/);
	assert.match(html, /New permanent accounts are not available/);
	assert.match(html, /class="form-input"/);
	assert.match(html, /class="shared-button shared-button--primary auth-form__submit"/);
});

test("profile presents role-specific guest and administrator states", async () => {
	const guestHtml = await renderFile(path.resolve("views/profile.ejs"), {
		csrfToken: "test-token",
		currentUser: {
			name: "Guest 42",
			role: "guest",
			email: null,
			guestExpiresAt: "2030-01-15T12:00:00.000Z",
		},
	});
	const adminHtml = await renderFile(path.resolve("views/profile.ejs"), {
		csrfToken: "test-token",
		currentUser: {
			name: "Admin",
			role: "admin",
			email: "admin@example.com",
			guestExpiresAt: null,
		},
	});

	assert.match(guestHtml, /data-profile-role="guest"/);
	assert.match(guestHtml, /Guest workspace/);
	assert.match(guestHtml, /automatically removed after expiration/);
	assert.doesNotMatch(guestHtml, /Manage exercise catalog/);
	assert.match(adminHtml, /data-profile-role="admin"/);
	assert.match(adminHtml, /href="\/admin\/library\/exercises"/);
	assert.match(adminHtml, /limited to managing global exercises/);
});

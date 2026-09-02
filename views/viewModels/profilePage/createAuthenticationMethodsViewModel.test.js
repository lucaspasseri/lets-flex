import assert from "node:assert/strict";
import test from "node:test";
import createAuthenticationMethodsViewModel from "./createAuthenticationMethodsViewModel.js";

test("password-only accounts offer Google linking", () => {
	assert.deepEqual(
		createAuthenticationMethodsViewModel({
			password: { connected: true },
			google: { connected: false, email: null },
		}),
		{
			password: { label: "Password", status: "Connected", showAddForm: false },
			google: {
				label: "Google",
				status: "Not linked",
				email: null,
				action: { label: "Link Google account", path: "/auth/google/link" },
			},
		},
	);
});

test("Google-only accounts expose provider metadata and password creation", () => {
	const model = createAuthenticationMethodsViewModel({
		password: { connected: false },
		google: { connected: true, email: "provider@example.com" },
	});
	assert.equal(model.password.status, "Not set");
	assert.equal(model.password.showAddForm, true);
	assert.equal(model.google.email, "provider@example.com");
	assert.equal(model.google.action, null);
});

test("combined accounts offer atomic Google replacement", () => {
	const model = createAuthenticationMethodsViewModel({
		password: { connected: true },
		google: { connected: true, email: "provider@example.com" },
	});
	assert.equal(model.password.status, "Connected");
	assert.equal(model.google.status, "Connected");
	assert.deepEqual(model.google.action, {
		label: "Change Google account",
		path: "/auth/google/replace",
	});
});

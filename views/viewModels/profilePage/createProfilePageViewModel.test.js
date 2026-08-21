import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import ejs from "ejs";
import createProfilePageViewModel from "./createProfilePageViewModel.js";

const page = {
	path: "/",
	url: "/profile",
	backUrl: "/",
	backUrlWithoutParams: "/",
	title: "Profile",
};

const users = [
	{
		id: 1,
		name: "Lucas",
		dateOfBirth: "10/10/2010",
		anamnesis: "",
	},
	{
		id: 2,
		name: "Maria",
		dateOfBirth: "02/02/2002",
		anamnesis: "Shoulder pain.",
	},
];

test("profile page exposes its template-boundary contract", () => {
	const result = createProfilePageViewModel({
		page,
		pageState: { userId: 2 },
		data: { currentUser: users[1], users },
	});

	assert.deepEqual(Object.keys(result), [
		"page",
		"pageState",
		"shell",
		"components",
	]);
	assert.equal(result.shell.currentUser, users[1]);
	assert.equal(result.components.profilePicker.items[1].isCurrent, true);
	assert.equal(result.components.profilePicker.clearSelectionAction.isVisible, true);
	assert.equal(result.components.profilePicker.clearSelectionAction.form.action, "/profile/clear-selection");
	assert.match(result.components.profilePicker.clearSelectionAction.form.description, /No programs, sessions, or workout history will be deleted/);
	assert.equal(result.components.createUserForm.form.action, "/users");
	assert.equal("layout" in result, false);
});

test("profile template renders populated and empty picker states", async () => {
	const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
		ejs.renderFile
	);
	/** @type {(name: string) => string} */
	const contentFor = name => `<!-- section:${name} -->`;

	for (const data of [
		{ currentUser: users[1], users, showsGuestAction: true },
		{ currentUser: null, users, showsGuestAction: false },
		{ currentUser: null, users: [], showsGuestAction: false },
	]) {
		const viewModel = createProfilePageViewModel({
			page,
			pageState: { userId: data.currentUser?.id ?? null },
			data,
		});
		const html = await renderFile(path.resolve("views/profile.ejs"), {
			...viewModel,
			contentFor,
		});

		assert.match(html, /class="profile-picker"/);
		assert.match(html, /create-user-form/);
		assert.equal(html.includes("clear-profile-selection-modal"), data.showsGuestAction);
		assert.equal(html.includes("Use as guest"), data.showsGuestAction);
	}
});

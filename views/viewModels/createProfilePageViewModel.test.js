import test from "node:test";
import assert from "node:assert/strict";

import createUserSwitcherViewModel from "./createUserSwitcherViewModel.js";
import createProfilePageViewModel from "./createProfilePageViewModel.js";

test("the shape of the Profile Page View Model", () => {
	const page = {};
	const pageState = {};

	const user = {
		id: 1,
		name: "Lucas",
		dateOfBirth: "10/10/2010",
		anamnesis: "",
	};

	const userArr = [
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

	const appState = {
		users: {
			current: user,
			items: userArr,
		},
	};

	const result = createProfilePageViewModel({
		// @ts-ignore
		page,
		// @ts-ignore
		pageState,
		appState,
		user,
		userArr,
	});

	assert.deepEqual(result.features, {
		userSwitcher: createUserSwitcherViewModel({
			userId: user?.id ?? null,
			userArr,
		}),
	});
});

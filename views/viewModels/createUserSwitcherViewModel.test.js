import test from "node:test";
import assert from "node:assert/strict";

import createUserSwitcherViewModel from "./createUserSwitcherViewModel.js";

test("the shape of items in the User Switcher", () => {
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

	const result = createUserSwitcherViewModel({
		userArr,
		userId: 2,
	});

	assert.deepEqual(result.items, [
		{
			id: 1,
			name: "Lucas",
			href: "/profile?userId=1",
			isActive: false,
		},
		{
			id: 2,
			name: "Maria",
			href: "/profile?userId=2",
			isActive: true,
		},
	]);
});

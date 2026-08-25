import test from "node:test";
import assert from "node:assert/strict";
import createProfilePickerViewModel from "./createProfilePickerViewModel.js";

test("profile picker creates meaningful card content", () => {
	const users = [
		{ id: 1, name: "Lucas Passeri", dateOfBirth: null, anamnesis: null },
		{ id: 2, name: "Maria", dateOfBirth: null, anamnesis: null },
	];
	const result = createProfilePickerViewModel({ currentUserId: 2, users });
	assert.equal(result.items[0].initials, "LP");
	assert.equal(result.items[1].isCurrent, true);
	assert.equal(result.items[1].statusLabel, "Active profile");
	assert.equal(result.clearSelectionAction.isVisible, true);
	assert.equal(
		result.clearSelectionAction.form.actions.cancel.label,
		"Keep Maria active",
	);
});

export function initializeMuscleRoleForm(form) {
	const addButton = form.querySelector("#add-muscle-role-relation");
	const list = form.querySelector("#muscle-role-list");
	const muscleSelect = form.querySelector("#muscle-select");
	const roleSelect = form.querySelector("#muscle-role-select");
	const message = form.querySelector("#muscle-role-list-message");
	if (!addButton || !list || !muscleSelect || !roleSelect || !message) return;

	addButton.addEventListener("click", () => {
		if (!muscleSelect.value || !roleSelect.value) return;
		const item = document.createElement("li");
		item.className = "musclePerformingListItem";
		const summary = document.createElement("p");
		summary.textContent = `${selectedLabel(muscleSelect)} (${selectedLabel(roleSelect)})`;
		item.append(
			summary,
			createHiddenInput("muscleId", muscleSelect.value),
			createHiddenInput("muscleRoleId", roleSelect.value),
			createRemoveButton(() => { item.remove(); updateList(); }),
		);
		list.append(item);
		updateList();
	});

	function updateList() {
		const items = Array.from(list.querySelectorAll("li"));
		items.forEach((item, index) => {
			item.querySelectorAll("[data-muscle-field]").forEach(input => {
				input.name = `muscleGroup[${index}][${input.dataset.muscleField}]`;
			});
		});
		message.textContent = items.length === 0
			? "No muscle relation found"
			: `${items.length} muscle relation(s) added`;
	}
}

function createHiddenInput(field, value) {
	const input = document.createElement("input");
	input.type = "hidden";
	input.dataset.muscleField = field;
	input.value = value;
	return input;
}

function createRemoveButton(remove) {
	const button = document.createElement("button");
	button.type = "button";
	button.textContent = "Remove";
	button.className = "simple-button";
	button.addEventListener("click", remove);
	return button;
}

function selectedLabel(select) {
	return select.options[select.selectedIndex]?.text ?? "";
}

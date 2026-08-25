export function initializeMuscleRoleForm(form) {
	const addButton = form.querySelector("[data-add-muscle-relation]");
	const list = form.querySelector("[data-muscle-list]");
	const muscleSelect = form.querySelector('[name="muscleId"]');
	const roleSelect = form.querySelector('[name="muscleRoleId"]');
	const message = form.querySelector("[data-muscle-list-message]");
	if (!addButton || !list || !muscleSelect || !roleSelect || !message) return;

	addButton.addEventListener("click", () => {
		if (!muscleSelect.value || !roleSelect.value) return;
		const item = createRelationItem({
			muscleId: muscleSelect.value,
			muscleLabel: selectedLabel(muscleSelect),
			muscleRoleId: roleSelect.value,
			roleLabel: selectedLabel(roleSelect),
		}, updateList);
		list.append(item);
		updateList();
	});

	list.querySelectorAll("[data-remove-muscle-relation]").forEach(button => {
		button.addEventListener("click", () => {
			button.closest("li")?.remove();
			updateList();
		});
	});

	function updateList(clearError = true) {
		const items = Array.from(list.querySelectorAll("li"));
		items.forEach((item, index) => {
			item.querySelectorAll("[data-muscle-field]").forEach(input => {
				input.name = `muscleGroup[${index}][${input.dataset.muscleField}]`;
			});
		});
		if (!clearError && message.hasAttribute("data-muscle-error")) return;
		message.removeAttribute("data-muscle-error");
		message.removeAttribute("role");
		message.textContent = items.length === 0
			? "No muscle relation found"
			: `${items.length} muscle relation(s) added`;
	}

	/** @param {Array<{muscleId: string | number, muscleRoleId: string | number}>} relations */
	const populateMuscleRelations = relations => {
		list.replaceChildren();
		for (const relation of relations) {
			list.append(createRelationItem({
				...relation,
				muscleLabel: optionLabel(muscleSelect, relation.muscleId),
				roleLabel: optionLabel(roleSelect, relation.muscleRoleId),
			}, updateList));
		}
		updateList();
	};
	/** @type {any} */ (form).populateMuscleRelations = populateMuscleRelations;

	updateList(false);
}

function createRelationItem(relation, updateList) {
	const item = document.createElement("li");
	item.className = "form-collection__item";
	const summary = document.createElement("p");
	summary.textContent = `${relation.muscleLabel} (${relation.roleLabel})`;
	item.append(
		summary,
		createHiddenInput("muscleId", relation.muscleId),
		createHiddenInput("muscleRoleId", relation.muscleRoleId),
		createRemoveButton(() => { item.remove(); updateList(); }),
	);
	return item;
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
	button.className = "form-collection__remove";
	button.dataset.removeMuscleRelation = "";
	button.addEventListener("click", remove);
	return button;
}

function optionLabel(select, value) {
	return Array.from(select.options).find(option => String(option.value) === String(value))?.text ?? "Unknown";
}

function selectedLabel(select) {
	return select.options[select.selectedIndex]?.text ?? "";
}

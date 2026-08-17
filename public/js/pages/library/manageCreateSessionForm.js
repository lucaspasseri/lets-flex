export function initializeCreateSessionForm(form) {
	const addButton = form.querySelector("#add-session-step");
	const list = form.querySelector("#session-step-list");
	const emptyMessage = form.querySelector("#session-step-list-message");
	const errorMessage = form.querySelector("#session-step-draft-error");
	const stepType = form.querySelector("#session-step-type-select");
	const exercise = form.querySelector("#session-exercise-variant-select");
	const sets = form.querySelector("#session-step-sets-input");
	const reps = form.querySelector("#session-step-reps-input");
	const load = form.querySelector("#session-step-load-input");
	const loadUnit = form.querySelector("#session-step-load-unit-select");
	if (!addButton || !list || !emptyMessage || !errorMessage || !stepType || !exercise || !sets || !reps || !load || !loadUnit) return;

	addButton.addEventListener("click", () => {
		if (!stepType.value || !exercise.value) {
			errorMessage.textContent = "Select both a step type and an exercise.";
			errorMessage.hidden = false;
			return;
		}
		errorMessage.hidden = true;
		const item = document.createElement("li");
		item.className = "form-collection__item session-step-draft";
		const summary = document.createElement("p");
		summary.textContent = `${selectedLabel(stepType)} — ${selectedLabel(exercise)}`;
		item.append(
			summary,
			createHiddenInput("stepTypeId", stepType.value),
			createHiddenInput("exerciseVariantId", exercise.value),
			createHiddenInput("sets", sets.value || "0"),
			createHiddenInput("reps", reps.value || "0"),
			createHiddenInput("loadValue", load.value || "0"),
			createHiddenInput("loadUnit", loadUnit.value || "Kilograms"),
			createRemoveButton(() => { item.remove(); updateList(); }),
		);
		list.append(item);
		updateList();
		[stepType, exercise, sets, reps, load, loadUnit].forEach(field => { field.value = ""; });
	});

	function updateList() {
		const items = Array.from(list.querySelectorAll(".session-step-draft"));
		items.forEach((item, index) => {
			item.querySelectorAll("[data-step-field]").forEach(input => {
				input.name = `stepRow[${index}][${input.dataset.stepField}]`;
			});
		});
		emptyMessage.hidden = items.length > 0;
	}
}

function createHiddenInput(field, value) {
	const input = document.createElement("input");
	input.type = "hidden";
	input.dataset.stepField = field;
	input.value = value;
	return input;
}

function createRemoveButton(remove) {
	const button = document.createElement("button");
	button.type = "button";
	button.textContent = "Remove";
	button.className = "form-collection__remove";
	button.addEventListener("click", remove);
	return button;
}

function selectedLabel(select) {
	return select.options[select.selectedIndex]?.text ?? "";
}

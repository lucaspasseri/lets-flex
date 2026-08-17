export function initializeSessionStepsFormField(root = document) {
	const form = document.querySelector("[data-create-session-form]");

	if (!form) return;

	const addButton = form.querySelector("#add-session-step");
	const stepList = form.querySelector("#session-step-list");
	const emptyMessage = form.querySelector("#session-step-list-message");
	const errorMessage = form.querySelector("#session-step-draft-error");

	const stepTypeSelect = form.querySelector("#session-step-type-select");
	const exerciseSelect = form.querySelector("#session-exercise-variant-select");
	const setsInput = form.querySelector("#session-step-sets-input");
	const repsInput = form.querySelector("#session-step-reps-input");
	const loadInput = form.querySelector("#session-step-load-input");
	const loadUnitSelect = form.querySelector("#session-step-load-unit-select");

	if (
		!addButton ||
		!stepList ||
		!emptyMessage ||
		!errorMessage ||
		!stepTypeSelect ||
		!exerciseSelect ||
		!setsInput ||
		!repsInput ||
		!loadInput ||
		!loadUnitSelect
	) {
		return;
	}

	addButton.addEventListener("click", addStep);

	function addStep() {
		const stepTypeId = stepTypeSelect.value;
		const exerciseVariantId = exerciseSelect.value;

		if (!stepTypeId || !exerciseVariantId) {
			errorMessage.textContent = "Select both a step type and an exercise.";
			errorMessage.hidden = false;
			return;
		}

		errorMessage.hidden = true;

		const item = document.createElement("li");
		item.className = "session-step-draft";

		const summary = document.createElement("p");
		summary.textContent = [
			selectedLabel(stepTypeSelect),
			selectedLabel(exerciseSelect),
			prescriptionLabel(),
		]
			.filter(Boolean)
			.join(" — ");

		item.append(
			summary,
			createHiddenInput("stepTypeId", stepTypeId),
			createHiddenInput("exerciseVariantId", exerciseVariantId),
			createHiddenInput("sets", setsInput.value || "0"),
			createHiddenInput("reps", repsInput.value || "0"),
			createHiddenInput("loadValue", loadInput.value || "0"),
			createHiddenInput("loadUnit", loadUnitSelect.value || "Kilograms"),
		);

		const removeButton = document.createElement("button");
		removeButton.type = "button";
		removeButton.textContent = "Remove";

		removeButton.addEventListener("click", () => {
			item.remove();
			updateStepList();
		});

		item.append(removeButton);
		stepList.append(item);

		clearDraft();
		updateStepList();
	}

	function createHiddenInput(fieldName, value) {
		const input = document.createElement("input");

		input.type = "hidden";
		input.dataset.stepField = fieldName;
		input.value = value;

		return input;
	}

	function updateStepList() {
		const items = Array.from(stepList.querySelectorAll(".session-step-draft"));

		items.forEach((item, index) => {
			item.querySelectorAll("[data-step-field]").forEach(input => {
				input.name = `stepRow[${index}][${input.dataset.stepField}]`;
			});
		});

		emptyMessage.hidden = items.length > 0;
	}

	function selectedLabel(select) {
		return select.options[select.selectedIndex]?.text ?? "";
	}

	function prescriptionLabel() {
		const sets = setsInput.value;
		const reps = repsInput.value;
		const load = loadInput.value;
		const unit = selectedLabel(loadUnitSelect);

		const setLabel = sets && reps ? `${sets} × ${reps}` : null;
		const loadLabel = load ? `${load} ${unit}` : null;

		return [setLabel, loadLabel].filter(Boolean).join(", ");
	}

	function clearDraft() {
		stepTypeSelect.value = "";
		exerciseSelect.value = "";
		setsInput.value = "";
		repsInput.value = "";
		loadInput.value = "";
		loadUnitSelect.value = "";
	}
}

initializeSessionStepsFormField();

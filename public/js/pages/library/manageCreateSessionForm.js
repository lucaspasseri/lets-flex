export function initializeSessionForm(form) {
	const addButton = form.querySelector("[data-add-session-step]");
	const list = form.querySelector("[data-session-step-list]");
	const emptyMessage = form.querySelector("[data-session-step-list-message]");
	const errorMessage = form.querySelector("[data-session-step-draft-error]");
	const stepType = form.elements.namedItem("draftStepTypeId");
	const exercise = form.elements.namedItem("draftExerciseVariantId");
	const sets = form.elements.namedItem("draftSets");
	const reps = form.elements.namedItem("draftReps");
	const load = form.elements.namedItem("draftLoadValue");
	const loadUnit = form.elements.namedItem("draftLoadUnit");
	if (
		!addButton ||
		!list ||
		!emptyMessage ||
		!errorMessage ||
		!stepType ||
		!exercise ||
		!sets ||
		!reps ||
		!load ||
		!loadUnit
	)
		return;

	addButton.addEventListener("click", () => {
		if (!stepType.value || !exercise.value) {
			errorMessage.textContent = "Select both a step type and an exercise.";
			errorMessage.hidden = false;
			return;
		}
		errorMessage.hidden = true;
		list.append(
			createStepItem(
				{
					stepTypeId: stepType.value,
					exerciseVariantId: exercise.value,
					sets: sets.value || "0",
					reps: reps.value || "0",
					loadValue: load.value || "0",
					loadUnit: loadUnit.value || "Kilograms",
					stepTypeLabel: selectedLabel(stepType),
					exerciseLabel: selectedLabel(exercise),
				},
				updateList,
			),
		);
		updateList();
		[stepType, exercise, sets, reps, load, loadUnit].forEach((field) => {
			field.value = "";
		});
	});

	list
		.querySelectorAll(".session-step-draft")
		.forEach((item) => bindActions(item, updateList));

	function updateList(clearError = true) {
		const items = Array.from(list.querySelectorAll(".session-step-draft"));
		items.forEach((item, index) => {
			item.querySelectorAll("[data-step-field]").forEach((input) => {
				input.name = `stepRow[${index}][${input.dataset.stepField}]`;
			});
			const up = item.querySelector("[data-move-step-up]");
			const down = item.querySelector("[data-move-step-down]");
			if (up) up.disabled = index === 0;
			if (down) down.disabled = index === items.length - 1;
		});
		if (!clearError && emptyMessage.hasAttribute("data-step-error")) return;
		emptyMessage.removeAttribute("data-step-error");
		emptyMessage.removeAttribute("role");
		emptyMessage.textContent =
			items.length === 0 ? "No steps added yet." : `${items.length} step(s) added.`;
		emptyMessage.hidden = false;
	}

	const populateSteps = (steps) => {
		list.replaceChildren();
		for (const step of steps) {
			list.append(
				createStepItem(
					{
						...step,
						stepTypeLabel: optionLabel(stepType, step.stepTypeId),
						exerciseLabel: optionLabel(exercise, step.exerciseVariantId),
					},
					updateList,
				),
			);
		}
		updateList();
	};
	/** @type {any} */ (form).populateSessionSteps = populateSteps;
	updateList(false);
}

export const initializeCreateSessionForm = initializeSessionForm;

function createStepItem(step, updateList) {
	const item = document.createElement("li");
	item.className = "form-collection__item session-step-draft";
	const summary = document.createElement("p");
	summary.textContent = `${step.stepTypeLabel} — ${step.exerciseLabel}`;
	const fields = [];
	if (step.stepId != null) fields.push(createHiddenInput("stepId", step.stepId));
	fields.push(
		createHiddenInput("stepTypeId", step.stepTypeId),
		createHiddenInput("exerciseVariantId", step.exerciseVariantId),
		createHiddenInput("sets", step.sets ?? 0),
		createHiddenInput("reps", step.reps ?? 0),
		createHiddenInput("loadValue", step.loadValue ?? 0),
		createHiddenInput("loadUnit", step.loadUnit || "Kilograms"),
	);
	const actions = document.createElement("div");
	actions.className = "form-collection__actions";
	actions.append(
		actionButton("Move up", "moveStepUp"),
		actionButton("Move down", "moveStepDown"),
		actionButton("Remove", "removeSessionStep"),
	);
	item.append(summary, ...fields, actions);
	bindActions(item, updateList);
	return item;
}

function bindActions(item, updateList) {
	item.querySelector("[data-remove-session-step]")?.addEventListener("click", () => {
		item.remove();
		updateList();
	});
	item.querySelector("[data-move-step-up]")?.addEventListener("click", () => {
		const previous = item.previousElementSibling;
		if (previous) item.parentElement.insertBefore(item, previous);
		updateList();
	});
	item.querySelector("[data-move-step-down]")?.addEventListener("click", () => {
		const next = item.nextElementSibling;
		if (next) item.parentElement.insertBefore(next, item);
		updateList();
	});
}

function createHiddenInput(field, value) {
	const input = document.createElement("input");
	input.type = "hidden";
	input.dataset.stepField = field;
	input.value = String(value);
	return input;
}

function actionButton(label, dataName) {
	const button = document.createElement("button");
	button.type = "button";
	button.textContent = label;
	button.className =
		dataName === "removeSessionStep"
			? "form-collection__remove"
			: "form-collection__move";
	button.dataset[dataName] = "";
	return button;
}

function selectedLabel(select) {
	return select.options[select.selectedIndex]?.text ?? "";
}

function optionLabel(select, value) {
	return (
		Array.from(select.options).find((option) => String(option.value) === String(value))
			?.text ?? "Unknown"
	);
}

const ROW_CONTEXT_PATTERN = /logFormRows\[(?:\d+|template)\]/g;

function setSubmissionPending(button) {
	if (!button) return;
	button.disabled = true;
	button.setAttribute("aria-disabled", "true");
	const label = button.querySelector(".shared-button__label");
	if (label && button.dataset.loadingLabel) {
		label.textContent = button.dataset.loadingLabel;
	}
}

export function initializeWorkoutLogForm(root) {
	const form = root.querySelector("[data-workout-perform-form]");
	const setList = root.querySelector("[data-set-list]");
	const rowTemplate = root.querySelector("[data-set-row-template]");
	const addSetButton = root.querySelector('[data-action="add-set"]');
	const setCount = root.querySelector("[data-set-count]");
	const announcement = root.querySelector("[data-set-announcement]");
	const maxSets = Number.parseInt(root.dataset.maxSets ?? "100", 10);

	if (!form || !setList || !rowTemplate || !addSetButton) return;

	const rows = () => [...setList.querySelectorAll("[data-set-row]")];
	const announce = (message) => {
		if (announcement) announcement.textContent = message;
	};

	function reindexRows() {
		const currentRows = rows();
		currentRows.forEach((row, index) => {
			const number = index + 1;
			const title = row.querySelector("[data-set-title]");
			if (title) title.textContent = `Set ${number}`;

			row
				.querySelectorAll("[id], [name], [for], [aria-describedby]")
				.forEach((element) => {
					for (const attribute of ["id", "name", "for", "aria-describedby"]) {
						const value = element.getAttribute(attribute);
						if (value) {
							element.setAttribute(
								attribute,
								value.replace(ROW_CONTEXT_PATTERN, `logFormRows[${index}]`),
							);
						}
					}
				});

			const removeButton = row.querySelector('[data-action="remove-set"]');
			if (removeButton) {
				removeButton.disabled = currentRows.length <= 1;
				removeButton.setAttribute("aria-label", `Remove set ${number}`);
			}
		});

		addSetButton.disabled = currentRows.length >= maxSets;
		if (setCount) {
			setCount.textContent = `${currentRows.length} ${currentRows.length === 1 ? "set" : "sets"} ready`;
		}
	}

	addSetButton.addEventListener("click", () => {
		if (rows().length >= maxSets) return;
		setList.append(rowTemplate.content.cloneNode(true));
		reindexRows();
		const currentRows = rows();
		currentRows.at(-1)?.querySelector(".form-input, .form-select")?.focus();
		announce(`Set ${currentRows.length} added.`);
	});

	setList.addEventListener("click", (event) => {
		const removeButton = event.target.closest('[data-action="remove-set"]');
		if (!removeButton || rows().length <= 1) return;
		const row = removeButton.closest("[data-set-row]");
		if (!row) return;
		const currentRows = rows();
		const removedIndex = currentRows.indexOf(row);
		row.remove();
		reindexRows();
		const remainingRows = rows();
		const focusRow = remainingRows[Math.min(removedIndex, remainingRows.length - 1)];
		focusRow?.querySelector('[data-action="remove-set"]')?.focus();
		announce(
			`Set ${removedIndex + 1} removed. ${remainingRows.length} ${remainingRows.length === 1 ? "set remains" : "sets remain"}.`,
		);
	});

	reindexRows();
}

export function initializeWorkoutTracker(root) {
	root.querySelector("[data-workout-feedback]")?.focus();
	root.querySelectorAll("[data-workout-log-form]").forEach(initializeWorkoutLogForm);
	root
		.querySelectorAll("[data-workout-action-form], [data-workout-perform-form]")
		.forEach((form) => {
			form.addEventListener("submit", (event) => {
				const fallbackButton = form.id
					? root.querySelector(`[data-workout-submit][form="${form.id}"]`)
					: form.querySelector("[data-workout-submit]");
				setSubmissionPending(event.submitter ?? fallbackButton);
			});
		});
}

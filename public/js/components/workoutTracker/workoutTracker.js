import { createBrowserTranslator } from "../../i18n.js";
const ROW_CONTEXT_PATTERN = /logFormRows\[(?:\d+|template)\]/g;

const FALLBACK_MESSAGES = {
	workout: {
		setTitle: { one: "Set {{count}}", other: "Set {{count}}" },
		setCount: { one: "{{count}} set ready", other: "{{count}} sets ready" },
		setAdded: "Set {{count}} added.",
		setRemoved: {
			one: "Set {{number}} removed. {{count}} set remains.",
			other: "Set {{number}} removed. {{count}} sets remain.",
		},
		removeSet: "Remove set {{count}}",
	},
};

function setSubmissionPending(button) {
	if (!button) return;
	button.disabled = true;
	button.setAttribute("aria-disabled", "true");
	const label = button.querySelector(".shared-button__label");
	if (label && button.dataset.loadingLabel) {
		label.textContent = button.dataset.loadingLabel;
	}
}

export function initializeWorkoutLogForm(
	root,
	translate = createBrowserTranslator(root, FALLBACK_MESSAGES),
) {
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
			if (title) title.textContent = translate("workout.setTitle", { count: number });

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
				removeButton.setAttribute(
					"aria-label",
					translate("workout.removeSet", { count: number }),
				);
			}
		});

		addSetButton.disabled = currentRows.length >= maxSets;
		if (setCount) {
			setCount.textContent = translate("workout.setCount", {
				count: currentRows.length,
			});
		}
	}

	addSetButton.addEventListener("click", () => {
		if (rows().length >= maxSets) return;
		setList.append(rowTemplate.content.cloneNode(true));
		reindexRows();
		const currentRows = rows();
		currentRows.at(-1)?.querySelector(".form-input, .form-select")?.focus();
		announce(translate("workout.setAdded", { count: currentRows.length }));
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
			translate("workout.setRemoved", {
				number: removedIndex + 1,
				count: remainingRows.length,
			}),
		);
	});

	reindexRows();
}

export function initializeWorkoutTracker(root) {
	root.querySelector("[data-workout-feedback]")?.focus();
	const translate = createBrowserTranslator(root, FALLBACK_MESSAGES);
	root
		.querySelectorAll("[data-workout-log-form]")
		.forEach((form) => initializeWorkoutLogForm(form, translate));
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

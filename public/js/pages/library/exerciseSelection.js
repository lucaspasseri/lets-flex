function getExerciseSection(root) {
	return root.querySelector?.('[data-library-discovery-section="exercises"]');
}

function findDetailsPanel(section, item) {
	const detailsId = item.dataset.exerciseDetailsId;
	return Array.from(section.querySelectorAll("[data-exercise-details-panel]")).find(
		(panel) => panel.id === detailsId,
	);
}

export function initializeExerciseSelection(root) {
	const section = getExerciseSection(root);
	if (!section) return;

	const items = () =>
		Array.from(section.querySelectorAll("[data-search-exercise-item]"));
	const triggers = () =>
		Array.from(section.querySelectorAll("[data-exercise-summary-trigger]"));

	function selectExercise(trigger) {
		const selectedItem = trigger?.closest?.("[data-search-exercise-item]") ?? null;
		const selectedPanel = selectedItem ? findDetailsPanel(section, selectedItem) : null;

		triggers().forEach((candidate) => {
			const selected = candidate === trigger;
			candidate.setAttribute("aria-current", String(selected));
			candidate.classList.toggle("session-summary--current", selected);
		});

		section.querySelectorAll("[data-exercise-details-panel]").forEach((panel) => {
			panel.hidden = panel !== selectedPanel;
		});
	}

	function ensureVisibleSelection() {
		const currentTrigger = triggers().find(
			(trigger) => trigger.getAttribute("aria-current") === "true",
		);
		const currentItem = currentTrigger?.closest?.("[data-search-exercise-item]");
		if (currentTrigger && currentItem && !currentItem.hidden) return;

		const nextItem = items().find((item) => !item.hidden);
		selectExercise(
			nextItem?.querySelector?.("[data-exercise-summary-trigger]") ?? null,
		);
	}

	triggers().forEach((trigger) => {
		trigger.addEventListener("click", () => selectExercise(trigger));
	});

	const query = section.querySelector("[data-library-query]");
	const filters = section.querySelectorAll("[data-library-filter]");
	const clearButton = section.querySelector("[data-library-clear]");
	query?.addEventListener("input", ensureVisibleSelection);
	filters.forEach((filter) =>
		filter.addEventListener("change", ensureVisibleSelection),
	);
	clearButton?.addEventListener("click", ensureVisibleSelection);

	ensureVisibleSelection();
}

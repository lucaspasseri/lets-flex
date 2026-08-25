export function initializeSearchAndFiltering(root) {
	const searchInput = root.querySelector("[data-library-search]");
	const sessionCount = root.querySelector(".session-summaries__count");
	const exerciseCount = root.querySelector(".exercise-templates__count");
	if (!searchInput || !sessionCount || !exerciseCount) return;

	const sessionItems = Array.from(root.querySelectorAll("[data-search-session-item]"));
	const exerciseItems = Array.from(
		root.querySelectorAll("[data-search-exercise-item]"),
	);

	searchInput.addEventListener("input", (event) => {
		const query = event.target.value.trim().toLowerCase();
		sessionCount.textContent = String(filterItems(sessionItems, query));
		exerciseCount.textContent = `${filterItems(exerciseItems, query)} TEMPLATES`;
	});
}

function filterItems(items, query) {
	let visibleCount = 0;
	items.forEach((item) => {
		const searchText = item.dataset.searchKeyWord ?? "";
		const listItem = item.matches("li") ? item : item.closest("li");
		const hidden = !searchText.toLowerCase().includes(query);
		if (listItem) listItem.hidden = hidden;
		if (!hidden) visibleCount += 1;
	});
	return visibleCount;
}

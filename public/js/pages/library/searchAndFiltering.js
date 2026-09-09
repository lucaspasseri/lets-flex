function normalize(value) {
	return String(value ?? "")
		.trim()
		.toLocaleLowerCase();
}

function includesQuery(searchText, query) {
	return !query || normalize(searchText).includes(query);
}

function matchesFilters(values, activeFilters) {
	return Object.entries(activeFilters).every(([name, selectedValue]) => {
		if (!selectedValue) return true;
		return (values[name] ?? []).some((value) => normalize(value) === selectedValue);
	});
}

/**
 * @param {{searchText: string, filters: Record<string, string[]>}} item
 * @param {{query: string, baseFilters: Record<string, string>}} state
 */
export function evaluateSessionItem(item, state) {
	return (
		includesQuery(item.searchText, state.query) &&
		matchesFilters(item.filters, state.baseFilters)
	);
}

/**
 * @param {{baseSearchText: string, baseFilters: Record<string, string[]>, variants: Array<{searchText: string, filters: Record<string, string[]>}>}} item
 * @param {{query: string, baseFilters: Record<string, string>, variantFilters: Record<string, string>}} state
 */
export function evaluateExerciseItem(item, state) {
	const baseMatchesFilters = matchesFilters(item.baseFilters, state.baseFilters);
	const baseMatchesQuery = includesQuery(item.baseSearchText, state.query);
	const visibleVariantIndexes = [];

	if (baseMatchesFilters) {
		item.variants.forEach((variant, index) => {
			const variantMatchesQuery =
				baseMatchesQuery || includesQuery(variant.searchText, state.query);
			if (
				variantMatchesQuery &&
				matchesFilters(variant.filters, state.variantFilters)
			) {
				visibleVariantIndexes.push(index);
			}
		});
	}

	return {
		matches: visibleVariantIndexes.length > 0,
		visibleVariantIndexes,
	};
}

function readFilterValues(element) {
	try {
		return JSON.parse(element.dataset.filterValues ?? "{}");
	} catch {
		return {};
	}
}

function readState(section) {
	const query = normalize(section.querySelector("[data-library-query]")?.value);
	const baseFilters = /** @type {Record<string, string>} */ ({});
	const variantFilters = /** @type {Record<string, string>} */ ({});

	section.querySelectorAll("[data-library-filter]").forEach((field) => {
		const target =
			field.dataset.filterLevel === "variant" ? variantFilters : baseFilters;
		target[field.dataset.libraryFilter] = normalize(field.value);
	});

	return { query, baseFilters, variantFilters };
}

function hasActiveFilters(state) {
	return Boolean(
		state.query ||
		Object.values(state.baseFilters).some(Boolean) ||
		Object.values(state.variantFilters).some(Boolean),
	);
}

function formatSessionCount(visibleCount, totalCount, filtered) {
	return filtered
		? `${visibleCount} of ${totalCount} ${totalCount === 1 ? "session" : "sessions"}`
		: `${visibleCount} ${visibleCount === 1 ? "session" : "sessions"}`;
}

function formatExerciseCount(
	visibleCount,
	visibleVariantCount,
	totalCount,
	totalVariantCount,
	filtered,
) {
	return filtered
		? `${visibleCount} of ${totalCount} ${totalCount === 1 ? "exercise" : "exercises"} · ${visibleVariantCount} of ${totalVariantCount} ${totalVariantCount === 1 ? "variant" : "variants"}`
		: `${visibleCount} ${visibleCount === 1 ? "exercise" : "exercises"} · ${visibleVariantCount} ${visibleVariantCount === 1 ? "variant" : "variants"}`;
}

function applySessionFilters(section, state) {
	const items = Array.from(section.querySelectorAll("[data-search-session-item]"));
	let visibleCount = 0;

	items.forEach((item) => {
		const matches = evaluateSessionItem(
			{
				searchText: item.dataset.searchKeyWord ?? "",
				filters: readFilterValues(item),
			},
			state,
		);
		item.hidden = !matches;
		if (matches) visibleCount += 1;
	});

	return { visibleCount, totalCount: items.length };
}

function applyExerciseFilters(section, state) {
	const items = Array.from(section.querySelectorAll("[data-search-exercise-item]"));
	let visibleCount = 0;
	let visibleVariantCount = 0;
	let totalVariantCount = 0;

	items.forEach((item) => {
		const variantElements = Array.from(
			item.querySelectorAll("[data-exercise-variant-item]"),
		);
		totalVariantCount += variantElements.length;
		const result = evaluateExerciseItem(
			{
				baseSearchText: item.dataset.baseSearchKeyWord ?? "",
				baseFilters: readFilterValues(item),
				variants: variantElements.map((variant) => ({
					searchText: variant.dataset.searchKeyWord ?? "",
					filters: readFilterValues(variant),
				})),
			},
			state,
		);

		const visibleVariantIndexes = new Set(result.visibleVariantIndexes);
		variantElements.forEach((variant, index) => {
			variant.hidden = !visibleVariantIndexes.has(index);
		});
		item.hidden = !result.matches;

		if (result.matches) {
			visibleCount += 1;
			visibleVariantCount += result.visibleVariantIndexes.length;
		}

		const variantCount = item.querySelector("[data-exercise-variant-count]");
		const variantResultCount = item.querySelector(
			"[data-exercise-variant-result-count]",
		);
		if (variantCount) {
			const matchedCount = result.visibleVariantIndexes.length;
			variantCount.textContent = hasActiveFilters(state)
				? `${matchedCount} of ${variantElements.length} variants`
				: `${variantElements.length} ${variantElements.length === 1 ? "variant" : "variants"}`;
			if (variantResultCount) {
				variantResultCount.textContent = hasActiveFilters(state)
					? `${matchedCount} shown · ${variantElements.length} total`
					: `${variantElements.length} total`;
			}
		}
	});

	return {
		visibleCount,
		visibleVariantCount,
		totalCount: items.length,
		totalVariantCount,
	};
}

function initializeDiscoverySection(section) {
	const query = section.querySelector("[data-library-query]");
	const filterFields = Array.from(section.querySelectorAll("[data-library-filter]"));
	const clearButton = section.querySelector("[data-library-clear]");
	const count = section.querySelector("[data-library-result-count]");
	const filteredEmpty = section.querySelector("[data-library-filter-empty]");
	const sectionType = section.dataset.libraryDiscoverySection;

	if (!query || !count || !sectionType) return;

	function applyFilters() {
		const state = readState(section);
		const filtered = hasActiveFilters(state);
		const result =
			sectionType === "sessions"
				? applySessionFilters(section, state)
				: applyExerciseFilters(section, state);

		if (sectionType === "sessions") {
			count.textContent = formatSessionCount(
				result.visibleCount,
				result.totalCount,
				filtered,
			);
		} else {
			count.textContent = formatExerciseCount(
				result.visibleCount,
				result.visibleVariantCount ?? 0,
				result.totalCount,
				result.totalVariantCount ?? 0,
				filtered,
			);
		}

		if (clearButton) clearButton.disabled = !filtered;
		if (filteredEmpty) filteredEmpty.hidden = result.visibleCount !== 0;
	}

	query.addEventListener("input", applyFilters);
	filterFields.forEach((field) => field.addEventListener("change", applyFilters));
	clearButton?.addEventListener("click", () => {
		query.value = "";
		filterFields.forEach((field) => {
			field.value = "";
		});
		applyFilters();
		query.focus();
	});
}

function initializeLibrarySectionTabs(root) {
	const tabsRoot = root.querySelector?.("[data-library-section-tabs]");
	if (!tabsRoot) return;

	const tabs = Array.from(tabsRoot.querySelectorAll("[data-tab]"));
	const panels = Array.from(tabsRoot.querySelectorAll("[data-tab-panel]"));
	const selectedTab = tabs.find((tab) => tab.getAttribute("aria-selected") === "true");
	const selectedPanelId = selectedTab?.getAttribute("aria-controls");

	panels.forEach((panel) => {
		const selected = panel.id === selectedPanelId;
		panel.hidden = !selected;
		panel.tabIndex = selected ? 0 : -1;
	});
	tabsRoot.dataset.libraryTabsReady = "true";
}

export function initializeSearchAndFiltering(root) {
	initializeLibrarySectionTabs(root);
	root
		.querySelectorAll("[data-library-discovery-section]")
		.forEach(initializeDiscoverySection);
}

function createTabs(root) {
	const tabList = root.querySelector("[data-tab-list]");
	if (!tabList) return;

	const tabs = Array.from(tabList.querySelectorAll("[data-tab]"));
	const panels = Array.from(root.querySelectorAll("[data-tab-panel]"));

	tabs.forEach((tab) => {
		tab.addEventListener("click", handleTabSelection);
		tab.addEventListener("keydown", handleKeydown);
	});

	function handleTabSelection(event) {
		selectTab(event.currentTarget);
	}

	function selectTab(selectedTab) {
		tabs.forEach((tab) => {
			const selected = tab === selectedTab;

			tab.setAttribute("aria-selected", String(selected));
			tab.tabIndex = selected ? 0 : -1;
		});

		const controlledPanelId = selectedTab.getAttribute("aria-controls");

		panels.forEach((panel) => {
			const selected = panel.id === controlledPanelId;

			panel.hidden = !selected;
			panel.tabIndex = selected ? 0 : -1;
		});
	}

	function handleKeydown(event) {
		const nextTab = calculateNextTab(event.currentTarget, event.key);

		if (!nextTab) return;

		event.preventDefault();
		nextTab.focus();
		selectTab(nextTab);
	}

	function calculateNextTab(currentTab, key) {
		const currentIndex = tabs.indexOf(currentTab);

		switch (key) {
			case "ArrowLeft":
				return tabs.at(currentIndex - 1);

			case "ArrowRight":
				return tabs[(currentIndex + 1) % tabs.length];

			case "Home":
				return tabs[0];

			case "End":
				return tabs.at(-1);

			default:
				return null;
		}
	}
}

export default createTabs;

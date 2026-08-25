const programsPage = document.querySelector("[data-programs-page]");

const setCalendarTransitionSource = (item) => {
	const transitionName = item.dataset.viewTransitionName;
	if (!transitionName) return;

	programsPage
		?.querySelectorAll('[style*="view-transition-name"]')
		.forEach((previousItem) => {
			if (!(previousItem instanceof HTMLElement)) return;
			previousItem.style.removeProperty("view-transition-name");
			previousItem.style.removeProperty("view-transition-class");
		});

	item.style.setProperty("view-transition-name", transitionName);
	item.style.setProperty("view-transition-class", "program-calendar-day");
};

if (programsPage) {
	programsPage.addEventListener("click", (event) => {
		if (!(event.target instanceof Element)) return;

		const calendarItem = event.target.closest("[data-view-transition-name]");
		if (calendarItem instanceof HTMLElement) {
			setCalendarTransitionSource(calendarItem);
		}

		const button = event.target.closest("[data-delete-entity]");
		if (!(button instanceof HTMLElement)) return;
		const serializedValues = button.dataset.deleteEntity;
		if (!serializedValues) return;
		const values = JSON.parse(serializedValues);
		const form = document.querySelector(`#delete-${values.entity}-form`);
		if (!(form instanceof HTMLFormElement)) return;

		form.action = `/${values.entity}s/${values.id}?_method=DELETE`;
		const heading = form.querySelector(".form-header h3");
		const description = form.querySelector(".form-header span");
		if (heading) heading.textContent = `Delete ${values.entity} “${values.name}”?`;
		if (description)
			description.textContent = `This permanently deletes ${values.entity} “${values.name}” and its dependent training data.`;
	});

	window.addEventListener("pagereveal", () => {
		const navigationApi =
			/** @type {{activation?: {from?: {url?: string}}} | undefined} */ (
				window.navigation
			);
		const fromUrl = navigationApi?.activation?.from?.url;
		if (!fromUrl) return;

		const dayId = new URL(fromUrl).searchParams.get("dayId");
		if (!dayId) return;

		const item = programsPage.querySelector(
			`[data-calendar-day-id="${CSS.escape(dayId)}"]`,
		);
		if (item instanceof HTMLElement) setCalendarTransitionSource(item);
	});
}

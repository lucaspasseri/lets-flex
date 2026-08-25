const programsPage = document.querySelector("[data-programs-page]");

if (programsPage) {
	programsPage.addEventListener("click", (event) => {
		if (!(event.target instanceof Element)) return;
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
}

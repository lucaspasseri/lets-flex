const searchInput = document.getElementById("library-search");

const searchSessionItemArr = Array.from(
	document.querySelectorAll("[data-search-session-item]"),
);
const searchExerciseItemArr = Array.from(
	document.querySelectorAll("[data-search-exercise-item]"),
);

const sessionArrSizeIndication = document.querySelector(
	".session-summaries__count",
);
const exerciseArrSizeIndication = document.querySelector(
	".exercise-templates__count",
);

searchInput.addEventListener("input", ev => {
	const queryText = ev.target.value.trim().toLowerCase();

	let sessionArrSize = searchSessionItemArr.length;
	let exerciseArrSize = searchExerciseItemArr.length;

	searchSessionItemArr.forEach(item => {
		const searchText = item.dataset.searchKeyWord ?? "";

		const shouldBeHidden = !searchText.toLowerCase().includes(queryText);

		item.closest("li").hidden = shouldBeHidden;

		if (shouldBeHidden) {
			sessionArrSize -= 1;
		}
	});

	searchExerciseItemArr.forEach(item => {
		const searchText = item.dataset.searchKeyWord ?? "";

		const shouldBeHidden = !searchText.toLowerCase().includes(queryText);

		item.closest("li").hidden = shouldBeHidden;

		if (shouldBeHidden) {
			exerciseArrSize -= 1;
		}
	});

	sessionArrSizeIndication.textContent = `${sessionArrSize}`;
	exerciseArrSizeIndication.textContent = `${exerciseArrSize} TEMPLATES`;
});

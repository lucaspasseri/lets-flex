/**
 * @typedef { import("./dayPage.types.js").CreateDayPageViewModelInput} CreateDayPageViewModelInput
 * @typedef { import("./dayPage.types.js").DayPageViewModel} DayPageViewModel
 */

/**
 * @param {CreateDayPageViewModelInput} input
 * @returns {DayPageViewModel}
 */

function createDayPageViewModel({ page, pageState, data }) {
	const currentUser = data?.users?.current ?? null;

	return {
		page,
		pageState,
		shell: {
			currentUser,
		},
		components: {},
	};
}

export default createDayPageViewModel;

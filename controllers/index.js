async function renderDashboardPage(req, res) {
	const currentWorkoutSession = res.locals.appState.currentWorkoutSession;
	console.log({ currentWorkoutSession });

	console.log({ n: JSON.stringify(currentWorkoutSession, null, 2) });

	res.locals.page.title = "Let's Flex!";
	res.render("index");
}

export { renderDashboardPage };

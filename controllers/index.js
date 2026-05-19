async function renderDashboardPage(req, res) {
	console.log({ l: res.locals });
	console.log({ ws: res.locals.appState?.currentWorkoutSession });
	res.locals.page.title = "Let's Flex!";
	res.render("index");
}

export { renderDashboardPage };

async function renderDashboardPage(req, res) {
	console.log({ sessionState: res.locals.sessionState });
	res.locals.page.title = "Let's Flex!";
	res.render("index");
}

export { renderDashboardPage };

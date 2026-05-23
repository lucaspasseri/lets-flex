async function renderDashboardPage(req, res) {
	res.locals.page.title = "Let's Flex!";
	res.render("index");
}

export { renderDashboardPage };

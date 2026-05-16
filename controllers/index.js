async function renderDashboardPage(req, res) {
	res.locals.page.title = "Let's Flex!";

	console.log({ ldb: res.locals });

	res.render("index");
}

export { renderDashboardPage };

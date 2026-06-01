async function renderProfilePage(_req, res) {
	res.locals.page.title = "Let's Flex!";
	res.render("profile");
}

export { renderProfilePage };

async function renderLibraryPage(_req, res) {
	res.locals.page.title = "Let's Flex!";
	res.render("library");
}

export { renderLibraryPage };

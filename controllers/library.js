async function renderLibraryPage(req, res) {
	res.render("library", {
		title: "Let's Flex!",
	});
}

export { renderLibraryPage };

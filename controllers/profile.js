async function renderProfilePage(_req, res) {
	res.locals.page.title = "Let's Flex!";

	// console.log({ profile: res.locals });

	res.render("profile");
}

export { renderProfilePage };

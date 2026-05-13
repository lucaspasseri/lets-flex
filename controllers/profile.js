import * as userDb from "./../db/users/index.js";

async function renderProfilePage(_req, res) {
	const userArr = await userDb.getAllUsers();
	res.locals.data = { ...res.locals.data, userArr };

	res.locals.page = { ...res.locals.page, title: "Let's Flex!" };

	res.render("profile");
}

export { renderProfilePage };

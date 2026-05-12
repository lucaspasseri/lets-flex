import * as userDb from "./../db/users/index.js";

async function renderProfilePage(_req, res) {
	res.locals.page = { ...res.locals.page, title: "Let's Flex!" };

	const userArr = await userDb.getAllUsers();
	res.locals.data = { ...res.locals.data, userArr };

	res.render("profile");
}

export { renderProfilePage };

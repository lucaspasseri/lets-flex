import * as userDb from "./../db/users/index.js";

async function renderProfilePage(_req, res) {
	const userArr = await userDb.getAllUsers();

	res.render("profile", {
		title: "Let's Flex!",
		userArr,
		currUserId: res.locals?.currentUser ? res.locals.currentUser.id : null,
	});
}

export { renderProfilePage };

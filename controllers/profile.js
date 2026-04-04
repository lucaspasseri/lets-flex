import * as userDb from "./../db/users/index.js";

async function renderProfilePage(_req, res) {
	const userArr = await userDb.getAllUsers();
	console.log({ l: res.locals, c: res.locals.currentUser });
	res.render("profile", {
		data: {
			title: "Let's Flex!",
			path: "/profile",
			userArr,
		},
	});
}

export { renderProfilePage };

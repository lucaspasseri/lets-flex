import setActiveUserAfterCreation from "../services/setActiveUserAfterCreation.js";

async function addNewUser(req, res) {
	await setActiveUserAfterCreation(req);

	res.redirect("/profile");
}

export { addNewUser };

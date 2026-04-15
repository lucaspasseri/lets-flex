import * as usersDb from "../db/users/index.js";

async function addNewUser(req, res) {
	const { name, dob, anamnesis } = req.body;

	await usersDb.postNewUser(name, dob, anamnesis);

	res.redirect("/profile");
}

export { addNewUser };

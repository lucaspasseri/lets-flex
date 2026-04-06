import * as usersDb from "../db/users/index.js";

async function addNewUser(req, res) {
	const { name, dob, anamnesis } = req.body;

	await usersDb.postNewUser(name, dob, anamnesis);

	res.redirect("/");
}

async function setUser(req, res) {
	const { userId } = req.body;
	const userExist = await usersDb.verifyUserExistence(Number(userId));

	if (!userExist) {
		return res.status(404).send("User not found");
	}

	req.session.userId = userId;

	res.redirect("/");
}

export { addNewUser, setUser };

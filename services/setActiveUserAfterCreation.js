import * as usersDb from "../db/users/index.js";
import pool from "../db/pool.js";

async function setActiveUserAfterCreation(req) {
	const { name, dob, anamnesis } = req.body;

	try {
		const userId = await usersDb.postNewUser(dob, { name, dob, anamnesis });
		req.session.state = { ...req.session.state, userId };
	} catch (err) {
		console.log(err);
	}
}

export default setActiveUserAfterCreation;

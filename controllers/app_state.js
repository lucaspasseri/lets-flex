import * as usersDb from "../db/users/index.js";
import * as programsDb from "../db/programs/index.js";

async function setCurrentUser(req, res) {
	const { userId } = req.body;

	const userExist = await usersDb.verifyUserExistence(Number(userId));

	if (!userExist) {
		return res.status(404).send("User not found");
	}

	if (req.session?.state) {
		req.session.state = { ...req.session.state, userId };
		return res.send(200);
	}

	req.session.state = { userId };
	res.send(200);
}

async function setCurrentProgram(req, res) {
	const { programId } = req.body;

	const programExist = await programsDb.verifyProgramExistence(
		Number(programId),
	);

	if (!programExist) {
		return res.status(404).send("Program not found");
	}

	if (req.session?.state) {
		req.session.state = { ...req.session.state, programId };
		return res.send(200);
	}

	req.session.state = { programId };
	res.send(200);
}

export { setCurrentUser, setCurrentProgram };

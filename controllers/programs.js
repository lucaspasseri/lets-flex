import * as programsDb from "../db/programs/index.js";

async function addNewProgram(req, res) {
	const { name, userId, goalId } = req.body;

	await programsDb.postNewProgram(name, userId, goalId);

	res.redirect("/");
}

async function renderProgramsPage(req, res) {
	res.render("programs", {
		data: {
			title: "Let's Flex!",
			path: "/programs",
		},
	});
}

export { addNewProgram, renderProgramsPage };

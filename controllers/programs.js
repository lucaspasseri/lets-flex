import setActiveProgramAfterCreation from "../services/setActiveProgramAfterCreation.js";

async function addNewProgram(req, res) {
	await setActiveProgramAfterCreation(req);

	res.redirect("/programs");
}

async function renderProgramsPage(req, res) {
	res.locals.page.title = "Let's Flex!";

	console.log({ pl: res.locals });

	res.render("programs");
}

async function renderDayPage(req, res) {
	res.locals.page.title = "Let's Flex!";

	console.log({ pd: res.locals });

	res.render("day");
}

export { addNewProgram, renderProgramsPage, renderDayPage };

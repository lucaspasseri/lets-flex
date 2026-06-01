import setActiveProgramAfterCreation from "../services/setActiveProgramAfterCreation.js";

async function addNewProgram(req, res) {
	await setActiveProgramAfterCreation(req);
	res.redirect("/programs");
}

async function renderProgramsPage(req, res) {
	res.locals.page.title = "Let's Flex!";
	res.render("programs");
}

async function renderDayPage(req, res) {
	res.locals.page.title = "Let's Flex!";
	res.render("day");
}

export { addNewProgram, renderProgramsPage, renderDayPage };

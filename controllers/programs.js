import setActiveProgramAfterCreation from "../services/setActiveProgramAfterCreation.js";

async function addNewProgram(req, res) {
	await setActiveProgramAfterCreation(req);
	res.redirect("/programs");
}

async function renderProgramsPage(req, res) {
	res.locals.page.title = "Let's Flex!";

	// console.log({ programs: res.locals });
	// console.log({ appState: res.locals.appState });

	res.render("programs");
}

async function renderDayPage(req, res) {
	res.locals.page.title = "Let's Flex!";
	res.render("day");
}

export { addNewProgram, renderProgramsPage, renderDayPage };

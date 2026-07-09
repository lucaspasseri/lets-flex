import setActiveUserAfterCreation from "../services/setActiveUserAfterCreation.js";

async function addNewUser(req, res) {
	await setActiveUserAfterCreation(req);

	res.redirect("/profile");
}

async function clearSession(req, res) {
	delete req.session.state;

	const { backUrl, backUrlWithoutParams } = res.locals.page;

	if (backUrlWithoutParams === "/profile/") res.redirect(backUrlWithoutParams);

	res.redirect(backUrl);
}

export { addNewUser, clearSession };

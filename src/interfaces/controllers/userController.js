import setActiveUserAfterCreation from "../../features/users/setActiveUserAfterCreation.js";

async function create(req, res, next) {
	const { name, dob, anamnesis } = req.body;

	const user = await setActiveUserAfterCreation({
		name,
		dob,
		anamnesis,
	});

	req.session.state = { userId: user?.id ?? null };
	res.redirect("/profile");
}

async function reset(req, res) {
	delete req.session.state;

	const { backUrl, backUrlWithoutParams } = res.locals.page;
	if (backUrlWithoutParams === "/profile/") res.redirect(backUrlWithoutParams);

	res.redirect(backUrl);
}

export const userController = {
	create,
	reset,
};

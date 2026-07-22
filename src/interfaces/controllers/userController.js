import createUser from "../../features/users/createUser.js";
import asyncHandler from "../../../utils/asyncControllerHandler.js";

async function create(req, res) {
	const { name, dob, anamnesis } = req.body;

	const user = await createUser({
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
	create: asyncHandler(create),
	reset,
};

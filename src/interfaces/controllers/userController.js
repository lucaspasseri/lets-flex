import createUser from "../../features/users/createUser.js";
import asyncHandler from "../../../utils/asyncControllerHandler.js";

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("express").Response} Response
 */

/**
 * @param {Request} req
 * @param {Response} res
 */

async function create(req, res) {
	const { name, dob, anamnesis } = req.body;

	const user = await createUser({
		name,
		dateOfBirth: dob,
		anamnesis,
	});

	// @ts-ignore
	req.session.state = { userId: user?.id ?? null };
	res.redirect("/profile");
}

/**
 * @param {Request} req
 * @param {Response} res
 */

async function reset(req, res) {
	// @ts-ignore
	delete req.session.state;

	const { backUrl, backUrlWithoutParams } = res.locals.page;
	if (backUrlWithoutParams === "/profile/") {
		res.redirect(backUrlWithoutParams);
		return;
	}

	res.redirect(backUrl);
}

export const userController = {
	create: asyncHandler(create),
	reset,
};

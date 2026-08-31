import asyncHandler from "../../../utils/asyncControllerHandler.js";
import * as usersRepository from "../../features/users/repository.js";
import * as userMapper from "../../features/users/mapper.js";

/** @param {import("express").Request} req @param {import("express").Response} res */
async function show(req, res) {
	// @ts-ignore -- application Passport principal.
	const row = await usersRepository.findById({ userId: req.user?.id ?? null });
	if (!row) {
		res.status(401).send("Authentication required");
		return;
	}
	const currentUser = userMapper.toLoggedUser(row);
	res.render("profile", {
		page: { ...res.locals.page, title: "Profile · Let's Flex!" },
		shell: { currentUser, activeNavigation: "profile" },
		currentUser,
	});
}

export const profileController = { show: asyncHandler(show) };

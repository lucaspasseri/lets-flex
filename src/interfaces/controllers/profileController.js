import asyncHandler from "../../../utils/asyncControllerHandler.js";
import getProfilePageData from "../../features/profile/getProfilePageData.js";
import resolveActiveUserId from "../../features/profile/resolveActiveUserId.js";
import createProfilePageViewModel from "../../../views/viewModels/profilePage/createProfilePageViewModel.js";

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("express").Response} Response
 * @typedef {import("../middleware/validateRequestBody.js").InvalidBodyResult} InvalidBodyResult
 * @typedef {import("../../../views/viewModels/profilePage/createUserFormViewModel.js").CreateUserFormState} CreateUserFormState
 */

/**
 * Loads and renders the shared profile page for both GET requests and failed
 * profile-creation submissions.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {CreateUserFormState} [createUserFormState]
 * @returns {Promise<void>}
 */
async function renderProfile(req, res, createUserFormState = undefined) {
	const userId = resolveActiveUserId({
		query: req?.query,
		sessionState: res.locals?.sessionState,
	});

	// @ts-ignore
	req.session.state = {
		// @ts-ignore
		...req.session.state,
		userId,
	};

	const page = {
		...res.locals.page,
		path: "/",
		url: "/profile",
		title: "Let's Flex!",
	};
	const pageState = { userId };

	const data = await getProfilePageData({
		userId,
	});

	const profile = createProfilePageViewModel({
		page,
		pageState,
		data,
		createUserFormState,
	});

	res.render("profile", profile);
}

/**
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
async function show(req, res) {
	await renderProfile(req, res);
}

/**
 * Invalid-body callback supplied to the reusable validation middleware.
 * Rendering stays here because it is specific to the profile page.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {InvalidBodyResult} result
 * @returns {Promise<void>}
 */
async function showCreateUserErrors(req, res, { errors, submittedValues }) {
	const values =
		submittedValues && typeof submittedValues === "object"
			? /** @type {Record<string, unknown>} */ (submittedValues)
			: {};

	res.status(400);
	await renderProfile(req, res, {
		errors,
		values,
		open: true,
	});
}

/**
 * Clears only the active profile selection and preserves other session state.
 *
 * @param {Request} req
 * @param {Response} res
 */
function clearSelection(req, res) {
	// @ts-ignore
	delete req.session.state.userId;
	res.redirect("/profile");
}

export const profileController = {
	show: asyncHandler(show),
	showCreateUserErrors,
	clearSelection,
};

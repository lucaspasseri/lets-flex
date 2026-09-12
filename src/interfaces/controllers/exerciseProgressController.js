import asyncHandler from "../../../utils/asyncControllerHandler.js";
import getExerciseProgressPageData from "../../features/exerciseProgress/getExerciseProgressPageData.js";
import ResourceNotFoundError from "../../features/shared/ResourceNotFoundError.js";
import {
	createExerciseProgressPageViewModel,
	createExerciseProgressStatePageViewModel,
} from "../../../views/viewModels/exerciseProgressPage/createExerciseProgressPageViewModel.js";

/**
 * @typedef {import("express").Request & {
 * validatedQuery?: import("../../features/exerciseProgress/exerciseProgressPage.types.js").ExerciseProgressPageQuery
 * }} ExerciseProgressRequest
 */

/** @param {ExerciseProgressRequest} req */
function authenticatedUserId(req) {
	// @ts-ignore -- populated by Passport before this router.
	const userId = Number(req.user?.id);
	if (!Number.isInteger(userId) || userId <= 0) throw new ResourceNotFoundError();
	return userId;
}

/**
 * @param {ExerciseProgressRequest} req
 * @param {import("express").Response} res
 */
async function show(req, res) {
	const userId = authenticatedUserId(req);
	const query =
		/** @type {import("../../features/exerciseProgress/exerciseProgressPage.types.js").ExerciseProgressPageQuery} */ (
			req.validatedQuery
		);
	const data = await getExerciseProgressPageData({ userId, query });
	if (!data.currentUser) throw new ResourceNotFoundError();

	res.render(
		"progress/index",
		createExerciseProgressPageViewModel({
			page: res.locals.page,
			data,
			query,
			translate: res.locals.t,
			language: res.locals.language,
		}),
	);
}

/**
 * @param {unknown} error
 * @param {import("express").Request} _req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
function handleError(error, _req, res, next) {
	if (res.headersSent) {
		next(error);
		return;
	}

	const notFound = error instanceof Error && error.name === "ResourceNotFoundError";
	if (!notFound) {
		const errorName = error instanceof Error ? error.name : "UnknownError";
		console.error(`Exercise progress request failed (${errorName})`);
	}
	res.status(notFound ? 404 : 500).render(
		"progress/status",
		createExerciseProgressStatePageViewModel({
			page: res.locals.page,
			currentUser: res.locals.authUser ?? null,
			state: notFound ? "not-found" : "failure",
			translate: res.locals.t,
		}),
	);
}

export const exerciseProgressController = {
	show: asyncHandler(show),
	handleError,
};

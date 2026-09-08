import asyncHandler from "../../../utils/asyncControllerHandler.js";
import ResourceNotFoundError from "../../features/shared/ResourceNotFoundError.js";
import {
	getWorkoutHistoryDetailPageData,
	getWorkoutHistoryListPageData,
} from "../../features/workoutHistory/getWorkoutHistoryPageData.js";
import {
	createWorkoutHistoryDetailPageViewModel,
	createWorkoutHistoryListPageViewModel,
	createWorkoutHistoryStatePageViewModel,
} from "../../../views/viewModels/workoutHistoryPage/createWorkoutHistoryPageViewModel.js";

/**
 * @typedef {import("express").Request & {
 * validatedQuery?: {programId: number | null, fromDate: string | null, toDate: string | null, page: number},
 * validatedParams?: {workoutSessionId: number}
 * }} HistoryRequest
 */

/** @param {HistoryRequest} req */
function authenticatedUserId(req) {
	// @ts-ignore -- populated by Passport before this router.
	const userId = Number(req.user?.id);
	if (!Number.isInteger(userId) || userId <= 0) throw new ResourceNotFoundError();
	return userId;
}

/** @param {HistoryRequest} req @param {import("express").Response} res */
async function showList(req, res) {
	const userId = authenticatedUserId(req);
	const query =
		/** @type {{programId: number | null, fromDate: string | null, toDate: string | null, page: number}} */ (
			req.validatedQuery
		);
	const filters = {
		programId: query.programId,
		fromDate: query.fromDate,
		toDate: query.toDate,
	};
	const data = await getWorkoutHistoryListPageData({
		userId,
		filters,
		page: query.page,
	});
	if (!data.currentUser) throw new ResourceNotFoundError();

	res.render(
		"history/index",
		createWorkoutHistoryListPageViewModel({
			page: res.locals.page,
			data,
			filters,
		}),
	);
}

/** @param {HistoryRequest} req @param {import("express").Response} res */
async function showDetail(req, res) {
	const userId = authenticatedUserId(req);
	const { workoutSessionId } = /** @type {{workoutSessionId: number}} */ (
		req.validatedParams
	);
	const query =
		/** @type {{programId: number | null, fromDate: string | null, toDate: string | null, page: number}} */ (
			req.validatedQuery
		);
	const data = await getWorkoutHistoryDetailPageData({ workoutSessionId, userId });
	if (!data.currentUser || !data.history) throw new ResourceNotFoundError();

	res.render(
		"history/detail",
		createWorkoutHistoryDetailPageViewModel({
			page: res.locals.page,
			currentUser: data.currentUser,
			history: data.history,
			returnFilters: {
				programId: query.programId,
				fromDate: query.fromDate,
				toDate: query.toDate,
			},
			returnPage: query.page,
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
		console.error(`Workout history request failed (${errorName})`);
	}
	res.status(notFound ? 404 : 500).render(
		"history/status",
		createWorkoutHistoryStatePageViewModel({
			page: res.locals.page,
			currentUser: res.locals.authUser ?? null,
			state: notFound ? "not-found" : "failure",
		}),
	);
}

export const workoutHistoryController = {
	showList: asyncHandler(showList),
	showDetail: asyncHandler(showDetail),
	handleError,
};

import asyncHandler from "../../../utils/asyncControllerHandler.js";
import toNullableNumber from "../../../utils/toNullableNumber.js";
import createProgram from "../../features/programs/createProgram.js";
import createProgramsPageViewModel from "../../../views/viewModels/programsPage/createProgramsPageViewModel.js";
import { getProgramsPageData } from "../../features/programs/getProgramsPageData.js";

/**
 * @typedef {import("express").Request & {session: {state?: Record<string, unknown>}}} Request
 * @typedef {import("express").Response} Response
 */

/**
 * @param {Request} req
 * @param {Response} res
 */

async function show(req, res) {
	const sessionState = res.locals?.sessionState;
	const userId = toNullableNumber(sessionState?.userId);
	const programIdSelection =
		toNullableNumber(req?.query?.programId) ??
		toNullableNumber(sessionState?.programId);
	const cycleIdSelection =
		toNullableNumber(req?.query?.cycleId) ??
		toNullableNumber(sessionState?.cycleId);

	const data = await getProgramsPageData({
		userId,
		programId: programIdSelection,
		cycleId: cycleIdSelection,
	});

	const { programs, cycles } = data;

	const programId = programs?.current?.id ?? null;
	const cycleId = cycles?.current?.id ?? null;

	req.session.state = {
		...req.session.state,
		programId,
		cycleId,
	};

	const page = { ...res.locals.page, title: "Let's Flex!" };
	const pageState = { userId, programId, cycleId };
	const programsPage = createProgramsPageViewModel({ page, pageState, data });

	res.render("programs", programsPage);
}

/**
 * @param {Request} req
 * @param {Response} res
 */

async function create(req, res) {
	const userId = toNullableNumber(res.locals?.sessionState?.userId);
	const { name, goalId, startDate } = req.body;

	if (userId === null) {
		throw new Error("An active profile is required to create a program");
	}

	const program = await createProgram({
		name,
		userId,
		goalId,
		startDate,
	});

	req.session.state = {
		...req.session.state,
		programId: program?.id ?? null,
		cycleId: null,
	};
	res.redirect("/programs");
}

export const programsController = {
	show: asyncHandler(show),
	create: asyncHandler(create),
};

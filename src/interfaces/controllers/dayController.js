import asyncHandler from "../../../utils/asyncControllerHandler.js";
import toNullableNumber from "../../../utils/toNullableNumber.js";
import getDayPageData from "../../features/day/getDayPageData.js";
import createDayPageViewModel from "../../../views/viewModels/dayPage/createDayPageViewModel.js";

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("express").Response} Response
 */

/**
 * @param {Request} req
 * @param {Response} res
 */

async function show(req, res) {
	await renderDay(req, res);
}

export async function renderDay(req, res, formState = {}) {
	const sessionState = res.locals?.sessionState;
	// @ts-ignore -- application Passport principal.
	const userId = toNullableNumber(req.user?.id);
	const validatedQuery = req.validatedQuery ?? {};
	const dayId =
		toNullableNumber(formState.dayId) ??
		toNullableNumber(validatedQuery.dayId) ??
		toNullableNumber(sessionState?.dayId);
	const sessionId = toNullableNumber(validatedQuery.sessionId);

	const data = await getDayPageData({ userId, dayId, locale: res.locals.language });
	const programId = data.program?.id ?? null;
	const cycleId = data.cycle?.id ?? null;

	// @ts-ignore
	req.session.state = {
		// @ts-ignore
		...req.session.state,
		...(data.days.current ? { programId, cycleId } : {}),
		dayId: data.days.current?.id ?? null,
	};

	const page = res.locals.page;
	const pageState = { userId, programId, cycleId, dayId, sessionId };

	const dayPage = createDayPageViewModel({
		page,
		pageState,
		data,
		translate: res.locals.t,
		language: res.locals.language,
		...formState,
	});

	res.render("day", dayPage);
}

export const dayController = {
	show: asyncHandler(show),
};

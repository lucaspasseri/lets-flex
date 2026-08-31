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
	const programId = toNullableNumber(sessionState?.programId);
	const validatedQuery = req.validatedQuery ?? {};
	const dayId =
		toNullableNumber(formState.dayId) ??
		toNullableNumber(validatedQuery.dayId) ??
		toNullableNumber(sessionState?.dayId);

	const data = await getDayPageData({ userId, programId, dayId });

	// @ts-ignore
	req.session.state = {
		// @ts-ignore
		...req.session.state,
		dayId: data?.days?.current?.id ?? null,
	};

	const page = { ...res.locals.page, title: "Let's Flex!" };
	const pageState = { userId, programId, dayId };

	const dayPage = createDayPageViewModel({ page, pageState, data, ...formState });

	res.render("day", dayPage);
}

export const dayController = {
	show: asyncHandler(show),
};

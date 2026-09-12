import asyncHandler from "../../../utils/asyncControllerHandler.js";
import toNullableNumber from "../../../utils/toNullableNumber.js";
import getLibraryPageData from "../../features/library/getLibraryPageData.js";
import createLibraryPageViewModel from "../../../views/viewModels/libraryPage/createLibraryPageViewModel.js";
import translateMessage from "../../infrastructure/i18n/translateMessage.js";

/**
 * @typedef {import("express").Request & {validatedQuery?: Record<string, any>}} Request
 * @typedef {import("express").Response} Response
 */

/**
 * @param {Request} req
 * @param {Response} res
 */

async function show(req, res) {
	await renderLibrary(req, res);
}

/**
 * @param {Request} req
 * @param {Response} res
 * @param {{exerciseTemplateFormState?: Record<string, any>, sessionTemplateFormState?: Record<string, any>, variantFormState?: Record<string, any>, privateVariantMutationState?: Record<string, any>, sessionCreationDayId?: unknown, sessionId?: unknown, pageFeedback?: {tone?: string, eyebrow?: string, id?: string, title: string, message: string} | null, managementMode?: boolean}} [formState]
 */
export async function renderLibrary(req, res, formState = {}) {
	// @ts-ignore -- application Passport principal.
	const userId = toNullableNumber(req.user?.id);
	const validatedQuery = req.validatedQuery ?? {};
	const sessionId =
		toNullableNumber(formState.sessionId) ?? toNullableNumber(validatedQuery.sessionId);
	const sessionCreationDayId =
		toNullableNumber(formState.sessionCreationDayId) ??
		toNullableNumber(validatedQuery.createSessionForDay);
	const managementMode = Boolean(formState.managementMode);

	const data = await getLibraryPageData({
		userId,
		sessionId,
		sessionCreationDayId,
		locale: res.locals.language,
	});
	if (
		!managementMode &&
		sessionCreationDayId !== null &&
		!data.sessionCreationContext
	) {
		res
			.status(404)
			.send(
				translateMessage(
					res.locals?.t,
					"mutation.trainingDayNotFound",
					"Training day not found",
				),
			);
		return;
	}
	const page = {
		...res.locals.page,
		title: managementMode
			? "Manage exercise catalog · Let's Flex!"
			: "Library · Let's Flex!",
	};
	const pageState = {
		userId,
		sessionId,
		sessionCreationDayId: data.sessionCreationContext?.day.id ?? null,
	};

	const library = createLibraryPageViewModel({
		page,
		pageState,
		data,
		translate: res.locals.t,
		language: res.locals.language,
		managementMode,
		pageFeedback: formState.pageFeedback,
		...formState,
	});

	res.render("library", library);
}

async function showAdmin(req, res) {
	await renderLibrary(req, res, { managementMode: true });
}

export const libraryController = {
	show: asyncHandler(show),
	showAdmin: asyncHandler(showAdmin),
};

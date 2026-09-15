import asyncHandler from "../../../utils/asyncControllerHandler.js";
import toNullableNumber from "../../../utils/toNullableNumber.js";
import getLibraryPageData from "../../features/library/getLibraryPageData.js";
import createLibraryPageViewModel from "../../../views/viewModels/libraryPage/createLibraryPageViewModel.js";
import translateMessage from "../../infrastructure/i18n/translateMessage.js";
import createMediaResolver from "../../features/media/createMediaResolver.js";
import { loadMediaAssignments } from "../../features/media/loadMediaAssignments.js";
import createMutationSuccessFeedback from "./mutationSuccessFeedback.js";

/**
 * @typedef {import("express").Request & {validatedQuery?: Record<string, any>}} Request
 * @typedef {import("express").Response} Response
 */

const LIBRARY_SUCCESS_MESSAGES = {
	"session-created": {
		titleKey: "mutation.sessionCreated",
		title: "Session created",
		messageKey: "mutation.sessionCreatedMessage",
		message: "The new session template is ready in your Library.",
	},
	"session-archived": {
		titleKey: "mutation.sessionArchived",
		title: "Session archived",
		messageKey: "mutation.sessionArchivedMessage",
		message: "The session template is no longer available for new plans.",
	},
	"session-deleted": {
		titleKey: "mutation.sessionDeleted",
		title: "Session deleted",
		messageKey: "mutation.sessionDeletedMessage",
		message: "The session template and its dependent training data were removed.",
	},
	"session-updated": {
		titleKey: "mutation.sessionUpdated",
		title: "Session updated",
		messageKey: "mutation.sessionUpdatedMessage",
		message: "Your session template changes are saved.",
	},
	"variant-created": {
		titleKey: "mutation.variantCreated",
		title: "Variant created",
		messageKey: "mutation.variantCreatedMessage",
		message: "Your private exercise variant is ready.",
	},
	"variant-updated": {
		titleKey: "mutation.variantUpdated",
		title: "Variant updated",
		messageKey: "mutation.variantUpdatedMessage",
		message: "Your private exercise variant changes are saved.",
	},
	"variant-archived": {
		titleKey: "mutation.variantArchived",
		title: "Variant archived",
		messageKey: "mutation.variantArchivedMessage",
		message: "The private exercise variant is no longer shown in your Library.",
	},
	"exercise-created": {
		titleKey: "mutation.exerciseCreated",
		title: "Exercise created",
		messageKey: "mutation.exerciseCreatedMessage",
		message: "The exercise is available in the global catalog.",
	},
	"exercise-archived": {
		titleKey: "mutation.exerciseArchived",
		title: "Exercise archived",
		messageKey: "mutation.exerciseArchivedMessage",
		message: "The exercise is no longer available in the global catalog.",
	},
	"exercise-updated": {
		titleKey: "mutation.exerciseUpdated",
		title: "Exercise updated",
		messageKey: "mutation.exerciseUpdatedMessage",
		message: "The exercise template changes are saved.",
	},
	"global-variant-created": {
		titleKey: "mutation.variantCreated",
		title: "Variant created",
		messageKey: "mutation.variantCreatedMessage",
		message: "The global exercise variant is ready in the catalog.",
	},
};

export function createLibrarySuccessFeedback(translate, operation) {
	return createMutationSuccessFeedback(
		translate,
		operation,
		LIBRARY_SUCCESS_MESSAGES,
		"library-page-feedback-title",
	);
}

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
	const queryFeedback = createLibrarySuccessFeedback(
		res.locals?.t,
		validatedQuery.saved ?? req.query?.saved,
	);
	const pageState = {
		userId,
		sessionId,
		sessionCreationDayId: data.sessionCreationContext?.day.id ?? null,
	};
	const mediaAssignments = await loadMediaAssignments({
		exerciseTemplates: data.exerciseTemplates,
		sessions: data.sessions,
	});

	const library = createLibraryPageViewModel({
		page,
		pageState,
		data,
		mediaResolver: createMediaResolver(mediaAssignments, {
			mediaUrlResolver: req.app.locals.mediaUrlResolver,
		}),
		translate: res.locals.t,
		language: res.locals.language,
		managementMode,
		...formState,
		pageFeedback: formState.pageFeedback ?? queryFeedback,
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

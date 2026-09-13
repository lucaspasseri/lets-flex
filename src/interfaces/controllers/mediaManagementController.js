import asyncHandler from "../../../utils/asyncControllerHandler.js";
import { respondWithApplicationRecovery } from "../applicationRecovery.js";
import {
	assignExistingMedia,
	createAndAssignUploadedMedia,
	MediaManagementNotFoundError,
	MediaManagementValidationError,
	removeAssignedMedia,
} from "../../features/media/manageMedia.js";
import { MediaUploadValidationError } from "../../features/media/mediaUpload.js";
import getMediaManagementPage from "../../features/media/getMediaManagementPage.js";
import createMediaManagementPageViewModel from "../../../views/viewModels/mediaManagement/createMediaManagementPageViewModel.js";

/** @typedef {import("express").Request & {validatedQuery?: {entity?: string, entityType?: string, search?: string, saved?: string}, validatedBody?: Record<string, any>, file?: Record<string, any>}} MediaManagementRequest */

function selectionFromReference(reference) {
	if (!reference) return { entityType: undefined, entityId: undefined };
	const [entityType, entityId] = reference.split(":");
	return { entityType, entityId: Number(entityId) };
}

export function createMediaManagementPageFeedback(translate, tone, operation) {
	const isSuccess = tone === "success";
	const feedbackTone = isSuccess ? "success" : "error";
	const successMessages = {
		upload: translate("mediaManagement.uploadSuccess", {
			defaultValue: "The image was uploaded and assigned to this entity.",
		}),
		assign: translate("mediaManagement.assignSuccess", {
			defaultValue: "The existing media was assigned to this entity.",
		}),
		remove: translate("mediaManagement.removeSuccess", {
			defaultValue: "The direct media assignment was removed.",
		}),
	};
	return {
		tone: feedbackTone,
		id: "media-management-feedback-title",
		eyebrow: translate(
			isSuccess ? "mediaManagement.successEyebrow" : "feedback.actionNotCompleted",
			{
				defaultValue: isSuccess ? "Success" : "Action not completed",
			},
		),
		title: translate(
			isSuccess ? "mediaManagement.successTitle" : "mediaManagement.errorTitle",
			{
				defaultValue: isSuccess ? "Media updated" : "Media could not be updated",
			},
		),
		message: isSuccess
			? (successMessages[operation] ??
				translate("mediaManagement.assignSuccess", {
					defaultValue: "The media was updated for this entity.",
				}))
			: translate("mediaManagement.failed", {
					defaultValue: "Review the information and try again.",
				}),
	};
}

/** @param {MediaManagementRequest} req @param {import("express").Response} res @param {any} [state] */
async function renderPage(req, res, state = {}) {
	const query = req.validatedQuery ?? {};
	const selection = selectionFromReference(state.entityReference ?? query.entity);
	const data = await getMediaManagementPage({
		...selection,
		entityTypeFilter: query.entityType,
		search: state.search ?? query.search,
		locale: res.locals.language,
	});
	if (selection.entityType && !data.selected) {
		respondWithApplicationRecovery(req, res, { kind: "notFound" });
		return;
	}
	res.render(
		"mediaManagement/index",
		createMediaManagementPageViewModel({
			page: {
				...res.locals.page,
				title: res.locals.t("mediaManagement.pageTitle", {
					defaultValue: "Media management · Let's Flex!",
				}),
			},
			currentUser: res.locals.authUser ?? null,
			data: { ...data, search: state.search ?? query.search ?? "" },
			formState: state.formState,
			pageFeedback:
				state.pageFeedback ??
				(query.saved
					? createMediaManagementPageFeedback(res.locals.t, "success", query.saved)
					: null),
			translate: res.locals.t,
		}),
	);
}

/** @param {MediaManagementRequest} req @param {import("express").Response} res */
async function show(req, res) {
	await renderPage(req, res);
}

/** @param {MediaManagementRequest} req @param {import("express").Response} res */
async function upload(req, res) {
	const body = req.validatedBody;
	if (!body) throw new Error("Media upload request was not validated.");
	try {
		await createAndAssignUploadedMedia({
			entityType: body.entityType,
			entityId: body.entityId,
			file: req.file ?? {},
			altTexts: { en: body.altTextEn, "pt-BR": body.altTextPtBr },
		});
	} catch (error) {
		if (error instanceof MediaManagementNotFoundError) {
			respondWithApplicationRecovery(req, res, { kind: "notFound" });
			return;
		}
		if (
			error instanceof MediaUploadValidationError ||
			error instanceof MediaManagementValidationError
		) {
			res.status(422);
			await renderPage(req, res, {
				entityReference: `${body.entityType}:${body.entityId}`,
				formState: {
					kind: "upload",
					values: body,
					errors: { fieldErrors: {}, formErrors: [error.message] },
				},
				pageFeedback: createMediaManagementPageFeedback(res.locals.t, "error"),
			});
			return;
		}
		throw error;
	}
	redirectAfterMutation(res, body, "upload");
}

/** @param {MediaManagementRequest} req @param {import("express").Response} res */
async function assign(req, res) {
	const body = req.validatedBody;
	if (!body) throw new Error("Media assignment request was not validated.");
	try {
		await assignExistingMedia({
			mediaAssetId: body.mediaAssetId,
			entityType: body.entityType,
			entityId: body.entityId,
			altTexts: { en: body.altTextEn, "pt-BR": body.altTextPtBr },
		});
	} catch (error) {
		if (error instanceof MediaManagementNotFoundError) {
			respondWithApplicationRecovery(req, res, { kind: "notFound" });
			return;
		}
		if (error instanceof MediaManagementValidationError) {
			res.status(422);
			await renderPage(req, res, {
				entityReference: `${body.entityType}:${body.entityId}`,
				formState: {
					kind: "existing",
					values: body,
					errors: { fieldErrors: {}, formErrors: [error.message] },
				},
				pageFeedback: createMediaManagementPageFeedback(res.locals.t, "error"),
			});
			return;
		}
		throw error;
	}
	redirectAfterMutation(res, body, "assign");
}

/** @param {MediaManagementRequest} req @param {import("express").Response} res */
async function remove(req, res) {
	const body = req.validatedBody;
	if (!body) throw new Error("Media removal request was not validated.");
	try {
		await removeAssignedMedia({ entityType: body.entityType, entityId: body.entityId });
	} catch (error) {
		if (error instanceof MediaManagementNotFoundError) {
			respondWithApplicationRecovery(req, res, { kind: "notFound" });
			return;
		}
		throw error;
	}
	redirectAfterMutation(res, body, "remove");
}

/** @param {import("express").Response} res @param {Record<string, any>} body @param {string} operation */
function redirectAfterMutation(res, body, operation) {
	res.redirect(
		`/admin/media?entity=${encodeURIComponent(`${body.entityType}:${body.entityId}`)}&saved=${operation}`,
	);
}

/** @param {MediaManagementRequest} req @param {import("express").Response} res @param {any} result @param {string} kind */
async function showValidationErrors(req, res, result, kind) {
	const values =
		result.submittedValues && typeof result.submittedValues === "object"
			? result.submittedValues
			: {};
	res.status(422);
	await renderPage(req, res, {
		entityReference:
			values.entityType && values.entityId
				? `${values.entityType}:${values.entityId}`
				: undefined,
		formState: { kind, values, errors: result.errors },
		pageFeedback: createMediaManagementPageFeedback(res.locals.t, "error"),
	});
}

export const mediaManagementController = {
	show: asyncHandler(show),
	upload: asyncHandler(upload),
	assign: asyncHandler(assign),
	remove: asyncHandler(remove),
	showUploadValidationErrors: (req, res, result) =>
		showValidationErrors(req, res, result, "upload"),
	showExistingValidationErrors: (req, res, result) =>
		showValidationErrors(req, res, result, "existing"),
	showRemoveValidationErrors: (req, res, result) =>
		showValidationErrors(req, res, result, "remove"),
};

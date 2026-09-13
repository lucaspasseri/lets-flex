import asyncHandler from "../../../utils/asyncControllerHandler.js";
import { randomUUID } from "node:crypto";
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
import {
	MediaGenerationError,
	requestMediaGenerationCandidate,
} from "../../features/media/mediaGeneration.js";
import { createPrivateMediaCandidateStorage } from "../../features/media/mediaCandidateStorage.js";
import {
	findPendingMediaGenerationCandidate,
	rejectMediaGenerationCandidate,
} from "../../features/media/mediaGenerationCandidates.js";
import {
	approveMediaGenerationCandidate,
	MediaGenerationApprovalError,
} from "../../features/media/approveMediaGenerationCandidate.js";
import createMediaManagementPageViewModel from "../../../views/viewModels/mediaManagement/createMediaManagementPageViewModel.js";

/** @typedef {import("express").Request & {validatedQuery?: {entity?: string, entityType?: string, search?: string, saved?: string}, validatedBody?: Record<string, any>, validatedParams?: {candidateId: number}, file?: Record<string, any>}} MediaManagementRequest */

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
		generate: translate("mediaManagement.generateSuccess", {
			defaultValue: "A private generated candidate is ready for review.",
		}),
		reject: translate("mediaManagement.rejectSuccess", {
			defaultValue: "The generated candidate was rejected and removed.",
		}),
		approve: translate("mediaManagement.approveSuccess", {
			defaultValue: "The generated image was approved and assigned to this entity.",
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

/** @param {MediaGenerationError} error */
export function mediaGenerationErrorStatus(error) {
	if (error.code === "rate_limited") return 429;
	if (
		error.code === "not_configured" ||
		error.code === "invalid_configuration" ||
		error.code === "provider_unavailable"
	) {
		return 503;
	}
	if (error.code === "provider_rejected" || error.code === "invalid_response") {
		return 502;
	}
	return 422;
}

/** @param {MediaManagementRequest} req */
function mediaGenerationDependencies(req) {
	return req.app.locals.mediaGenerationDependencies ?? {};
}

function createGenerationNonce(req, selected) {
	if (!selected) return null;
	const state = /** @type {any} */ (req.session).state;
	state.mediaGenerationNonces ??= {};
	const key = `${selected.entity_type}:${selected.entity_id}`;
	const nonce = randomUUID();
	state.mediaGenerationNonces[key] = nonce;
	return nonce;
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
			data: {
				...data,
				search: state.search ?? query.search ?? "",
				generationNonce: data.selected?.canGenerate
					? createGenerationNonce(req, data.selected)
					: null,
			},
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

/** @param {MediaManagementRequest} req @param {import("express").Response} res */
async function generate(req, res) {
	const body = req.validatedBody;
	if (!body) throw new Error("Media generation request was not validated.");
	const key = `${body.entityType}:${body.entityId}`;
	const sessionState = /** @type {any} */ (req.session).state;
	if (sessionState.mediaGenerationNonces?.[key] !== body.requestNonce) {
		res.status(409);
		await renderPage(req, res, {
			entityReference: key,
			formState: {
				kind: "generation",
				values: body,
				errors: { fieldErrors: {}, formErrors: ["Refresh the page and try again."] },
			},
			pageFeedback: createMediaManagementPageFeedback(res.locals.t, "error"),
		});
		return;
	}
	delete sessionState.mediaGenerationNonces[key];
	try {
		await requestMediaGenerationCandidate(
			{
				entityType: body.entityType,
				entityId: body.entityId,
				requestedByUserId: /** @type {any} */ (req.user).id,
				refinement: body.refinement,
			},
			mediaGenerationDependencies(req),
		);
	} catch (error) {
		if (error instanceof MediaGenerationError) {
			res.status(mediaGenerationErrorStatus(error));
			await renderPage(req, res, {
				entityReference: key,
				formState: {
					kind: "generation",
					values: body,
					errors: { fieldErrors: {}, formErrors: [error.message] },
				},
				pageFeedback: createMediaManagementPageFeedback(res.locals.t, "error"),
			});
			return;
		}
		throw error;
	}
	redirectAfterMutation(res, body, "generate");
}

/** @param {MediaManagementRequest} req @param {import("express").Response} res */
async function regenerate(req, res) {
	const body = req.validatedBody;
	if (!body) throw new Error("Media regeneration request was not validated.");
	const key = `${body.entityType}:${body.entityId}`;
	const sessionState = /** @type {any} */ (req.session).state;
	if (sessionState.mediaGenerationNonces?.[key] !== body.requestNonce) {
		res.status(409);
		await renderPage(req, res, {
			entityReference: key,
			formState: {
				kind: "generation",
				values: body,
				errors: { fieldErrors: {}, formErrors: ["Refresh the page and try again."] },
			},
			pageFeedback: createMediaManagementPageFeedback(res.locals.t, "error"),
		});
		return;
	}
	const previous = await findPendingMediaGenerationCandidate(body.candidateId);
	if (
		!previous ||
		previous.entity_type !== body.entityType ||
		previous.entity_id !== body.entityId
	) {
		respondWithApplicationRecovery(req, res, { kind: "notFound" });
		return;
	}
	delete sessionState.mediaGenerationNonces[key];
	try {
		await requestMediaGenerationCandidate(
			{
				entityType: body.entityType,
				entityId: body.entityId,
				requestedByUserId: /** @type {any} */ (req.user).id,
				refinement: body.refinement,
			},
			mediaGenerationDependencies(req),
		);
		await rejectMediaGenerationCandidate({
			candidateId: previous.id,
			entityType: body.entityType,
			entityId: body.entityId,
			reviewerUserId: /** @type {any} */ (req.user).id,
			storage: createPrivateMediaCandidateStorage(),
		});
	} catch (error) {
		if (error instanceof MediaGenerationError) {
			res.status(mediaGenerationErrorStatus(error));
			await renderPage(req, res, {
				entityReference: key,
				formState: {
					kind: "generation",
					values: body,
					errors: { fieldErrors: {}, formErrors: [error.message] },
				},
				pageFeedback: createMediaManagementPageFeedback(res.locals.t, "error"),
			});
			return;
		}
		throw error;
	}
	redirectAfterMutation(res, body, "generate");
}

/** @param {MediaManagementRequest} req @param {import("express").Response} res */
async function previewCandidate(req, res) {
	const candidate = await findPendingMediaGenerationCandidate(
		req.validatedParams?.candidateId ?? 0,
	);
	if (!candidate) {
		respondWithApplicationRecovery(req, res, { kind: "notFound" });
		return;
	}
	try {
		const file = await createPrivateMediaCandidateStorage().read(candidate.storage_key);
		res.set("Cache-Control", "private, no-store");
		res.type(candidate.mime_type).send(file);
	} catch (error) {
		if (/** @type {any} */ (error)?.code === "ENOENT") {
			respondWithApplicationRecovery(req, res, { kind: "notFound" });
			return;
		}
		throw error;
	}
}

/** @param {MediaManagementRequest} req @param {import("express").Response} res */
async function rejectCandidate(req, res) {
	const body = req.validatedBody;
	if (!body) throw new Error("Candidate rejection request was not validated.");
	const candidate = await rejectMediaGenerationCandidate({
		candidateId: req.validatedParams?.candidateId ?? 0,
		entityType: body.entityType,
		entityId: body.entityId,
		reviewerUserId: /** @type {any} */ (req.user).id,
		storage: createPrivateMediaCandidateStorage(),
	});
	if (!candidate) {
		respondWithApplicationRecovery(req, res, { kind: "notFound" });
		return;
	}
	redirectAfterMutation(res, body, "reject");
}

/** @param {MediaManagementRequest} req @param {import("express").Response} res */
async function approveCandidate(req, res) {
	const body = req.validatedBody;
	if (!body) throw new Error("Candidate approval request was not validated.");
	try {
		await approveMediaGenerationCandidate({
			candidateId: req.validatedParams?.candidateId ?? 0,
			entityType: body.entityType,
			entityId: body.entityId,
			reviewerUserId: /** @type {any} */ (req.user).id,
			altTexts: { en: body.altTextEn, "pt-BR": body.altTextPtBr },
		});
	} catch (error) {
		if (error instanceof MediaGenerationApprovalError) {
			if (error.code === "candidate_not_found") {
				respondWithApplicationRecovery(req, res, { kind: "notFound" });
				return;
			}
			res.status(422);
			await renderPage(req, res, {
				entityReference: `${body.entityType}:${body.entityId}`,
				formState: {
					kind: "approval",
					values: body,
					errors: { fieldErrors: {}, formErrors: [error.message] },
				},
				pageFeedback: createMediaManagementPageFeedback(res.locals.t, "error"),
			});
			return;
		}
		throw error;
	}
	redirectAfterMutation(res, body, "approve");
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
	generate: asyncHandler(generate),
	regenerate: asyncHandler(regenerate),
	previewCandidate: asyncHandler(previewCandidate),
	rejectCandidate: asyncHandler(rejectCandidate),
	approveCandidate: asyncHandler(approveCandidate),
	showUploadValidationErrors: (req, res, result) =>
		showValidationErrors(req, res, result, "upload"),
	showExistingValidationErrors: (req, res, result) =>
		showValidationErrors(req, res, result, "existing"),
	showRemoveValidationErrors: (req, res, result) =>
		showValidationErrors(req, res, result, "remove"),
	showGenerationValidationErrors: (req, res, result) =>
		showValidationErrors(req, res, result, "generation"),
	showRejectValidationErrors: (req, res, result) =>
		showValidationErrors(req, res, result, "reject"),
	showApprovalValidationErrors: (req, res, result) =>
		showValidationErrors(req, res, result, "approval"),
};

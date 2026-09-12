import asyncHandler from "../../../utils/asyncControllerHandler.js";
import createSession from "../../features/sessions/createSession.js";
import archiveSession, {
	SessionTemplateNotArchivableError,
} from "../../features/sessions/archiveSession.js";
import deleteSession, {
	SessionTemplateNotDeletableError,
} from "../../features/sessions/deleteSession.js";
import updateSessionTemplate, {
	SessionTemplateNotFoundError,
} from "../../features/sessions/updateSessionTemplate.js";
import { renderLibrary } from "./libraryController.js";
import getOwnedTrainingDayContext from "../../features/day/getOwnedTrainingDayContext.js";
import respondWithContextualMutationError from "../contextualMutationError.js";
import translateMessage from "../../infrastructure/i18n/translateMessage.js";

/** @typedef {import("express").Request & {validatedBody?: any, validatedParams?: any}} Request */
/** @typedef {import("express").Response} Response */
/** @typedef {import("../middleware/validateRequestBody.js").InvalidBodyResult} InvalidBodyResult */

/** @param {Request & {validatedBody?: any}} req @param {Response} res */
async function create(req, res) {
	const t = (key, defaultValue) =>
		translateMessage(res.locals?.t, `mutation.${key}`, defaultValue);
	const { name, notes, stepRow, contextDayId = null } = req.validatedBody;
	// @ts-ignore -- authenticated route principal.
	const ownerUserId = req.user.id;
	const sessionCreationContext = await getOwnedTrainingDayContext({
		dayId: contextDayId,
		userId: ownerUserId,
	});
	if (contextDayId !== null && !sessionCreationContext) {
		await respondWithContextualMutationError(req, res, {
			status: 404,
			fallbackMessage: "Training day not found",
			fallbackKey: "mutation.trainingDayNotFound",
			render: () =>
				renderLibrary(req, res, {
					pageFeedback: {
						id: "library-page-feedback-title",
						title: t("sessionNotCreated", "Session not created"),
						message: t(
							"refreshLibraryDay",
							"That training day is no longer available. Return to Programs and choose a current day.",
						),
					},
					sessionTemplateFormState: {
						mode: "create",
						open: true,
						values: req.validatedBody,
						errors: {
							fieldErrors: {
								contextDayId: t(
									"trainingDayUnavailable",
									"That training day is no longer available.",
								),
							},
							formErrors: [],
						},
					},
				}),
		});
		return;
	}

	const session = await createSession({
		name,
		notes,
		stepRowArr: stepRow,
		ownerUserId,
	});

	res.redirect(
		sessionCreationContext
			? `/programs/day?dayId=${sessionCreationContext.day.id}&sessionId=${session.id}`
			: "/library",
	);
}

/** @param {Request} req @param {Response} res @param {InvalidBodyResult} result */
async function showCreateErrors(req, res, { errors, submittedValues }) {
	const submittedRecord =
		submittedValues && typeof submittedValues === "object"
			? /** @type {Record<string, any>} */ (submittedValues)
			: {};
	res.status(422);
	await renderLibrary(req, res, {
		sessionCreationDayId: submittedRecord.contextDayId,
		sessionTemplateFormState: {
			mode: "create",
			open: true,
			values: submittedRecord,
			errors,
		},
	});
}

/** @param {Request} req @param {Response} res */
async function archive(req, res) {
	const t = (key, defaultValue) =>
		translateMessage(res.locals?.t, `mutation.${key}`, defaultValue);
	const { sessionId } = req.validatedParams;

	try {
		// @ts-ignore -- authenticated route principal.
		await archiveSession({ sessionId, ownerUserId: req.user.id });
	} catch (error) {
		if (error instanceof SessionTemplateNotArchivableError) {
			await respondWithContextualMutationError(req, res, {
				status: 404,
				fallbackMessage: "Session template not found or already archived",
				fallbackKey: "mutation.refreshLibraryTemplates",
				render: () =>
					renderLibrary(req, res, {
						pageFeedback: {
							id: "library-page-feedback-title",
							title: t("sessionNotArchived", "Session not archived"),
							message: t(
								"refreshLibraryTemplates",
								"That session template is no longer available or has already been archived. Refresh Library to see the current templates.",
							),
						},
					}),
			});
			return;
		}
		throw error;
	}

	res.redirect("/library");
}

/** @param {Request} req @param {Response} res */
async function destroy(req, res) {
	const t = (key, defaultValue) =>
		translateMessage(res.locals?.t, `mutation.${key}`, defaultValue);
	const { sessionId } = req.validatedParams;

	try {
		// @ts-ignore -- authenticated route principal.
		await deleteSession({ sessionId, ownerUserId: req.user.id });
	} catch (error) {
		if (error instanceof SessionTemplateNotDeletableError) {
			await respondWithContextualMutationError(req, res, {
				status: 404,
				fallbackMessage: "Session template not found",
				fallbackKey: "mutation.sessionTemplateUnavailable",
				render: () =>
					renderLibrary(req, res, {
						pageFeedback: {
							id: "library-page-feedback-title",
							title: t("sessionNotDeleted", "Session not deleted"),
							message: t(
								"sessionUnavailable",
								"That session is no longer available or is not owned by this profile. Refresh Library to see the current sessions.",
							),
						},
					}),
			});
			return;
		}
		throw error;
	}

	res.redirect("/library");
}

/** @param {Request & {validatedBody?: any}} req @param {Response} res */
async function update(req, res) {
	const t = (key, defaultValue) =>
		translateMessage(res.locals?.t, `mutation.${key}`, defaultValue);
	const { sessionId } = req.validatedParams;
	try {
		await updateSessionTemplate({
			...req.validatedBody,
			sessionId,
			// @ts-ignore -- authenticated route principal.
			ownerUserId: req.user.id,
		});
	} catch (error) {
		if (error instanceof SessionTemplateNotFoundError) {
			await respondWithContextualMutationError(req, res, {
				status: 404,
				fallbackMessage: "Session template not found",
				fallbackKey: "mutation.sessionTemplateUnavailable",
				render: () =>
					renderLibrary(req, res, {
						pageFeedback: {
							id: "library-page-feedback-title",
							title: t("sessionNotUpdated", "Session not updated"),
							message: t(
								"sessionTemplateUnavailable",
								"That session template is no longer available. Your changes are preserved below; refresh Library before trying again.",
							),
						},
						sessionTemplateFormState: {
							mode: "update",
							open: true,
							sessionId: req.validatedParams.sessionId,
							values: req.validatedBody,
							errors: {
								fieldErrors: {},
								formErrors: [
									t(
										"sessionTemplateUnavailable",
										"That session template is no longer available. Refresh Library before trying again.",
									),
								],
							},
						},
					}),
			});
			return;
		}
		throw error;
	}
	res.redirect(`/library?sessionId=${sessionId}#session-details-title-${sessionId}`);
}

/** @param {Request} req @param {Response} res @param {InvalidBodyResult} result */
async function showUpdateErrors(req, res, { errors, submittedValues }) {
	res.status(422);
	await renderLibrary(req, res, {
		sessionTemplateFormState: {
			mode: "update",
			open: true,
			sessionId: req.params.sessionId,
			values:
				submittedValues && typeof submittedValues === "object" ? submittedValues : {},
			errors,
		},
	});
}

export const sessionController = {
	create: asyncHandler(create),
	showCreateErrors,
	update: asyncHandler(update),
	showUpdateErrors,
	archive: asyncHandler(archive),
	delete: asyncHandler(destroy),
};

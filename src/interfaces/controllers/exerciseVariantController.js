import asyncHandler from "../../../utils/asyncControllerHandler.js";
import * as exerciseVariantsRepository from "../../features/exerciseVariants/repository.js";
import { renderLibrary } from "./libraryController.js";
import respondWithContextualMutationError from "../contextualMutationError.js";
import translateMessage from "../../infrastructure/i18n/translateMessage.js";

/** @param {any} error */
function getConstraintFailure(error) {
	if (error?.code === "23505") {
		return {
			status: 409,
			fallbackKey: "mutation.variantConflict",
			fallbackMessage: "A variant with that name already exists for this exercise.",
			message:
				"A variant with that name already exists for this exercise. Choose a different name.",
		};
	}
	if (error?.code === "23503") {
		return {
			status: 422,
			fallbackKey: "mutation.relatedResourcesFallback",
			fallbackMessage: "Choose valid related Library resources.",
			message: "Choose a current exercise and equipment option, then try again.",
		};
	}
	return null;
}

/** @param {any} req @param {any} res */
async function create(req, res) {
	const t = (key, defaultValue) =>
		translateMessage(res.locals?.t, `mutation.${key}`, defaultValue);
	try {
		const variant = await exerciseVariantsRepository.createPrivate({
			...req.validatedBody,
			exerciseId: req.validatedParams.exerciseId,
			ownerUserId: req.user.id,
		});
		if (!variant) {
			await respondWithContextualMutationError(req, res, {
				status: 404,
				fallbackMessage: "Exercise not found",
				fallbackKey: "mutation.exerciseNotFound",
				render: () =>
					renderLibrary(req, res, {
						pageFeedback: {
							id: "library-page-feedback-title",
							title: t("variantNotCreated", "Variant not created"),
							message: t(
								"exerciseUnavailable",
								"That exercise is no longer available. Refresh Library and try again.",
							),
						},
						variantFormState: {
							values: {
								...req.validatedBody,
								exerciseId: req.validatedParams.exerciseId,
							},
							errors: { fieldErrors: {}, formErrors: [] },
						},
					}),
			});
			return;
		}
		res.redirect(`/library#exercise-template-${variant.id}`);
	} catch (error) {
		const failure = getConstraintFailure(error);
		if (!failure) throw error;
		await respondWithContextualMutationError(req, res, {
			...failure,
			fallbackMessage: failure.fallbackMessage,
			render: () =>
				renderLibrary(req, res, {
					pageFeedback: {
						id: "library-page-feedback-title",
						title: t("variantNotCreated", "Variant not created"),
						message: t(
							failure.status === 409 ? "variantConflict" : "relatedResourcesInvalid",
							failure.message,
						),
					},
					variantFormState: {
						values: {
							...req.validatedBody,
							exerciseId: req.validatedParams.exerciseId,
						},
						errors: {
							fieldErrors:
								failure.status === 409
									? {
											name: t(
												"differentVariantName",
												"Choose a different variant name.",
											),
										}
									: {},
							formErrors:
								failure.status === 409
									? []
									: [t("relatedResourcesInvalid", failure.message)],
						},
					},
				}),
		});
	}
}

/** @param {any} req @param {any} res */
async function update(req, res) {
	const t = (key, defaultValue) =>
		translateMessage(res.locals?.t, `mutation.${key}`, defaultValue);
	try {
		const variant = await exerciseVariantsRepository.updatePrivate({
			...req.validatedBody,
			variantId: req.validatedParams.variantId,
			ownerUserId: req.user.id,
		});
		if (!variant) {
			await respondWithContextualMutationError(req, res, {
				status: 404,
				fallbackMessage: "Exercise variant not found",
				fallbackKey: "mutation.exerciseNotFound",
				render: () =>
					renderLibrary(req, res, {
						pageFeedback: {
							id: "library-page-feedback-title",
							title: t("variantNotUpdated", "Variant not updated"),
							message: t(
								"privateVariantUnavailable",
								"That private variant is no longer available. Refresh Library to see the current exercises.",
							),
						},
						privateVariantMutationState: {
							variantId: req.validatedParams.variantId,
							values: req.validatedBody,
						},
					}),
			});
			return;
		}
		res.redirect(`/library#exercise-template-${variant.id}`);
	} catch (error) {
		const failure = getConstraintFailure(error);
		if (!failure) throw error;
		await respondWithContextualMutationError(req, res, {
			...failure,
			fallbackMessage: failure.fallbackMessage,
			render: () =>
				renderLibrary(req, res, {
					pageFeedback: {
						id: "library-page-feedback-title",
						title: t("variantNotUpdated", "Variant not updated"),
						message: t(
							failure.status === 409 ? "variantConflict" : "relatedResourcesInvalid",
							failure.message,
						),
					},
					privateVariantMutationState: {
						variantId: req.validatedParams.variantId,
						values: req.validatedBody,
						error: t(
							failure.status === 409 ? "variantConflict" : "relatedResourcesInvalid",
							failure.message,
						),
					},
				}),
		});
	}
}

/** @param {any} req @param {any} res */
async function archive(req, res) {
	const t = (key, defaultValue) =>
		translateMessage(res.locals?.t, `mutation.${key}`, defaultValue);
	const variant = await exerciseVariantsRepository.archivePrivate({
		variantId: req.validatedParams.variantId,
		ownerUserId: req.user.id,
	});
	if (!variant) {
		await respondWithContextualMutationError(req, res, {
			status: 404,
			fallbackMessage: "Exercise variant not found",
			fallbackKey: "mutation.exerciseNotFound",
			render: () =>
				renderLibrary(req, res, {
					pageFeedback: {
						id: "library-page-feedback-title",
						title: t("variantNotArchived", "Variant not archived"),
						message: t(
							"privateVariantArchived",
							"That private variant is no longer available or has already been archived. Refresh Library to see the current exercises.",
						),
					},
				}),
		});
		return;
	}
	res.redirect("/library");
}

export const exerciseVariantController = {
	create: asyncHandler(create),
	update: asyncHandler(update),
	archive: asyncHandler(archive),
};

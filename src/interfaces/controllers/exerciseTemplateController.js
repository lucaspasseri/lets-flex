import asyncHandler from "../../../utils/asyncControllerHandler.js";
import createExerciseTemplate from "../../features/exerciseTemplates/createExerciseTemplate.js";
import deleteExerciseTemplate from "../../features/exerciseTemplates/deleteExerciseTemplate.js";
import updateExerciseTemplate, {
	ExerciseTemplateNotFoundError,
} from "../../features/exerciseTemplates/updateExerciseTemplate.js";
import { renderLibrary } from "./libraryController.js";
import * as exerciseVariantsRepository from "../../features/exerciseVariants/repository.js";

/** @typedef {import("express").Request & {validatedBody?: any, validatedParams?: any}} Request */
/** @typedef {import("express").Response} Response */
/** @typedef {import("../middleware/validateRequestBody.js").InvalidBodyResult} InvalidBodyResult */

/** @param {Request & {validatedBody?: any}} req @param {Response} res */
async function create(req, res) {
	const { name, movementPatternId, equipmentId, muscleGroup } = req.validatedBody;

	await createExerciseTemplate({
		name,
		movementPatternId,
		equipmentId,
		muscleGroup,
		// @ts-ignore -- route requires the application Passport principal.
		createdByUserId: req.user.id,
	});

	res.redirect("/admin/library/exercises");
}

/** @param {Request} req @param {Response} res @param {InvalidBodyResult} result */
async function showCreateErrors(req, res, { errors, submittedValues }) {
	res.status(422);
	await renderLibrary(req, res, {
		managementMode: true,
		exerciseTemplateFormState: {
			mode: "create",
			open: true,
			values:
				submittedValues && typeof submittedValues === "object" ? submittedValues : {},
			errors,
		},
	});
}

/** @param {Request} req @param {Response} res */
async function destroy(req, res) {
	const { exerciseId } = req.validatedParams;
	await deleteExerciseTemplate(exerciseId);

	res.redirect("/admin/library/exercises");
}

/** @param {Request} req @param {Response} res */
async function createGlobalVariant(req, res) {
	try {
		const variant = await exerciseVariantsRepository.createGlobal({
			...req.validatedBody,
			exerciseId: req.validatedParams.exerciseId,
		});
		if (!variant) {
			res.status(404).send("Exercise not found");
			return;
		}
		res.redirect(`/admin/library/exercises#exercise-template-${variant.id}`);
	} catch (error) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "23505"
		) {
			res.status(409).send("A global variant with that name already exists.");
			return;
		}
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "23503"
		) {
			res.status(422).send("Choose valid related Library resources.");
			return;
		}
		throw error;
	}
}

/** @param {Request & {validatedBody?: any}} req @param {Response} res */
async function update(req, res) {
	const { exerciseId, variantId } = req.validatedParams;

	try {
		await updateExerciseTemplate({
			...req.validatedBody,
			exerciseId,
			variantId,
		});
	} catch (error) {
		if (error instanceof ExerciseTemplateNotFoundError) {
			res.status(404).send("Exercise template not found");
			return;
		}
		throw error;
	}

	res.redirect(`/admin/library/exercises#exercise-template-${variantId}`);
}

/** @param {Request} req @param {Response} res @param {InvalidBodyResult} result */
async function showUpdateErrors(req, res, { errors, submittedValues }) {
	res.status(422);
	await renderLibrary(req, res, {
		managementMode: true,
		exerciseTemplateFormState: {
			mode: "update",
			open: true,
			exerciseId: req.params.exerciseId,
			variantId: req.params.variantId,
			values:
				submittedValues && typeof submittedValues === "object" ? submittedValues : {},
			errors,
		},
	});
}

export const exerciseTemplateController = {
	create: asyncHandler(create),
	showCreateErrors,
	update: asyncHandler(update),
	showUpdateErrors,
	delete: asyncHandler(destroy),
	createGlobalVariant: asyncHandler(createGlobalVariant),
};

import asyncHandler from "../../../utils/asyncControllerHandler.js";
import createExerciseTemplate from "../../features/exerciseTemplates/createExerciseTemplate.js";
import deleteExerciseTemplate from "../../features/exerciseTemplates/deleteExerciseTemplate.js";
import updateExerciseTemplate, {
	ExerciseTemplateNotFoundError,
} from "../../features/exerciseTemplates/updateExerciseTemplate.js";
import { renderLibrary } from "./libraryController.js";

/** @typedef {import("express").Request} Request */
/** @typedef {import("express").Response} Response */
/** @typedef {import("../../../middlewares/validateRequestBody.js").InvalidBodyResult} InvalidBodyResult */

/** @param {Request} req @param {Response} res */
async function create(req, res) {
	const { name, movementPatternId, equipmentId, muscleGroup } = req.body;

	await createExerciseTemplate({
		name,
		movementPatternId,
		equipmentId,
		muscleGroup,
	});

	res.redirect("/library");
}

/** @param {Request} req @param {Response} res */
async function destroy(req, res) {
	const { exerciseId } = req.params;
	await deleteExerciseTemplate(exerciseId);

	res.redirect("/library");
}

/** @param {Request & {validatedBody?: any}} req @param {Response} res */
async function update(req, res) {
	const exerciseId = Number(req.params.exerciseId);
	const variantId = Number(req.params.variantId);

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

	res.redirect(`/library#exercise-template-${variantId}`);
}

/** @param {Request} req @param {Response} res @param {InvalidBodyResult} result */
async function showUpdateErrors(req, res, { errors, submittedValues }) {
	res.status(422);
	await renderLibrary(req, res, {
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
	update: asyncHandler(update),
	showUpdateErrors,
	delete: asyncHandler(destroy),
};

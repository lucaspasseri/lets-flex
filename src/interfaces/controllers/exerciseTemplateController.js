import asyncHandler from "../../../utils/asyncControllerHandler.js";
import createExerciseTemplate from "../../features/exerciseTemplates/createExerciseTemplate.js";
import deleteExerciseTemplate from "../../features/exerciseTemplates/deleteExerciseTemplate.js";

async function create(req, res) {
	const { name, movementPatternId, equipmentId, muscleGroup } = req.body;

	console.log({ name, movementPatternId, equipmentId, muscleGroup });

	await createExerciseTemplate({
		name,
		movementPatternId,
		equipmentId,
		muscleGroup,
	});

	// await exerciseCluster.addNewExerciseCluster(
	// 	name,
	// 	movementPatternId,
	// 	equipmentId,
	// 	muscleGroup,
	// );

	res.redirect("/library");
}

async function destroy(req, res) {
	const { exerciseId } = req.params;

	await deleteExerciseTemplate(exerciseId);

	res.redirect("/library");
}

export const exerciseTemplateController = {
	create: asyncHandler(create),
	delete: asyncHandler(destroy),
};

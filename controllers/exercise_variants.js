import * as exerciseVariantsDb from "../db/exercise_variants/index.js";

async function addNewExerciseVariant(req, res) {
	const { name, exerciseId, equipmentId } = req.body;

	await exerciseVariantsDb.postNewExerciseVariant(
		name,
		exerciseId,
		equipmentId,
	);

	res.redirect("/");
}

export { addNewExerciseVariant };

import * as exerciseVariantsDb from "../db/exercise_variants/index.js";
import pool from "../db/pool.js";

async function addNewExerciseVariant(req, res) {
	const { name, exerciseId, equipmentId } = req.body;

	await exerciseVariantsDb.postNewExerciseVariant(
		name,
		exerciseId,
		equipmentId,
	);

	res.redirect("/");
}

async function deleteExerciseVariant(req, res) {
	const { exerciseVariantId } = req.params;
	console.log({ exerciseVariantId });

	await exerciseVariantsDb.deleteExerciseVariant(pool, { exerciseVariantId });

	res.redirect("/library");
}

export { addNewExerciseVariant, deleteExerciseVariant };

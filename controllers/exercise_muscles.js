import * as exerciseMusclesDb from "../db/exercise_muscles/index.js";

async function addNewExerciseMuscle(req, res) {
	const { exerciseId, muscleId, role } = req.body;

	await exerciseMusclesDb.postNewExerciseMuscle(exerciseId, muscleId, role);

	res.redirect("/");
}

export { addNewExerciseMuscle };

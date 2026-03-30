import * as exercisesDb from "../db/exercises/index.js";

async function addNewExercise(req, res) {
	const { name, movementPatternId } = req.body;

	await exercisesDb.postNewExercise(name, movementPatternId);

	res.redirect("/");
}

export { addNewExercise };

import * as exerciseCluster from "../db/exercise_cluster/index.js";

async function addNewExerciseCluster(req, res) {
	const { name, movementPatternId, equipmentId, muscleGroup } = req.body;

	await exerciseCluster.addNewExerciseCluster(
		name,
		movementPatternId,
		equipmentId,
		muscleGroup,
	);

	res.redirect("/library");
}

export { addNewExerciseCluster };

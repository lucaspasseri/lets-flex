import * as exercisesRepository from "../exercises/repository.js";

async function deleteExerciseTemplate(exerciseId) {
	await exercisesRepository.deleteById({ exerciseId });
}

export default deleteExerciseTemplate;

import pool from "../../../db/pool.js";
import * as exercisesRepository from "../exercises/repository.js";
import * as exerciseMusclesRepository from "../exerciseMuscles/repository.js";
import * as exerciseVariantsRepository from "../exerciseVariants/repository.js";

async function createExerciseTemplate({
	name,
	movementPatternId,
	equipmentId,
	muscleGroup,
}) {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		const exercise = await exercisesRepository.create(
			{ name, movementPatternId },
			client,
		);
		if (!exercise) {
			throw new Error("Exercise could not be created");
		}

		for (const { muscleId, muscleRoleId } of muscleGroup) {
			await exerciseMusclesRepository.create(
				{ exerciseId: exercise.id, muscleId, muscleRoleId },
				client,
			);
		}

		await exerciseVariantsRepository.create(
			{ name, exerciseId: exercise.id, equipmentId },
			client,
		);

		await client.query("COMMIT");
	} catch (err) {
		await client.query("ROLLBACK");
		throw new Error("Failed to create exercise template", { cause: err });
	} finally {
		client.release();
	}
}

export default createExerciseTemplate;

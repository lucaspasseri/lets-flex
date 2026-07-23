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

		// ESTA CORRETO CRIAR UM NOVO EXERCíCIO TODA VEZ OU AS VARIANTS TERIAM ESSE PAPEL???????

		const exercise = await exercisesRepository.create(
			{ name, movementPatternId },
			client,
		);

		for (const { muscleId, muscleRoleId } of muscleGroup) {
			await exerciseMusclesRepository.create(
				{ exerciseId: exercise?.id, muscleId, muscleRoleId },
				client,
			);
		}

		await exerciseVariantsRepository.create(
			{ name, exerciseId: exercise?.id, equipmentId },
			client,
		);

		await await client.query("COMMIT");
	} catch (err) {
		console.log({ err });
		await client.query("ROLLBACK");
		throw new Error(`Failed to add new exercise cluster: ${err.message}`);
	} finally {
		client.release();
	}
}

export default createExerciseTemplate;

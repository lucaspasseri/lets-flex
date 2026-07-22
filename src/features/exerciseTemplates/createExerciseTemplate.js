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

		// const {
		// 	rows: [{ id: exerciseId }],
		// } = await client.query(
		// 	"INSERT INTO exercises (name, movement_pattern_id) VALUES ($1, $2) RETURNING id",
		// 	[name, movementPatternId],
		// );

		// ESTA CORRETO CRIAR UM NOVO EXERCICIO TODA VEZ OU AS VARIANTS TERIAM ESSE PAPEL???????

		const exercise = await exercisesRepository.create(
			{ name, movementPatternId },
			client,
		);

		console.log({ exercise });

		for (const { muscleId, muscleRoleId } of muscleGroup) {
			// await client.query(
			// 	"INSERT INTO exercise_muscles (exercise_id, muscle_id, muscle_role_id) VALUES ($1, $2, $3)",
			// 	[exerciseId, muscleId, muscleRoleId],
			// );

			await exerciseMusclesRepository.create(
				{ exerciseId: exercise?.id, muscleId, muscleRoleId },
				client,
			);
		}

		// await client.query(
		// 	"INSERT INTO exercise_variants (name, exercise_id, equipment_id) VALUES ($1, $2, $3)",
		// 	[name, exerciseId, equipmentId],
		// );

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

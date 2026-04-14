import pool from "../pool.js";
import toNullableNumber from "../../utils/toNullableNumber.js";

async function getAllExerciseVariants() {
	const { rows } = await pool.query("SELECT * FROM exercise_variants");
	return rows;
}

async function postNewExerciseVariant(name, exerciseId, equipmentId) {
	await pool.query(
		`
		INSERT INTO exercise_variants (name, exercise_id, equipment_id)
		VALUES ($1, $2, $3)
		`,
		[name, Number(exerciseId), toNullableNumber(equipmentId)],
	);
}

export { getAllExerciseVariants, postNewExerciseVariant };

import pool from "../pool.js";
import toNullableNumber from "../../utils/toNullableNumber.js";

async function getAllExerciseVariantsWithJoins() {
	const { rows } = await pool.query(
		"SELECT ev.*, ex.name AS exercise_name, COALESCE(eq.name, 'No equipment') AS equipment_name FROM exercise_variants ev JOIN exercises ex ON ev.exercise_id = ex.id LEFT JOIN equipments eq ON ev.equipment_id = eq.id",
	);
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

export { getAllExerciseVariantsWithJoins, postNewExerciseVariant };

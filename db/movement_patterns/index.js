import pool from "../pool.js";

async function getAllMovementPatterns() {
	const { rows: movementPatterns } = await pool.query(
		"SELECT * FROM movement_patterns",
	);

	return movementPatterns;
}

async function postNewMovementPattern(name) {
	await pool.query("INSERT INTO movement_patterns (name) VALUES ($1)", [name]);
}

async function deleteMovementPatternByName(name) {
	await pool.query("DELETE FROM movement_patterns WHERE name = $1", [name]);
}

export {
	getAllMovementPatterns,
	postNewMovementPattern,
	deleteMovementPatternByName,
};

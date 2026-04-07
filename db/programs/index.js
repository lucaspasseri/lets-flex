import pool from "../pool.js";

async function getAllPrograms() {
	const { rows: programs } = await pool.query("SELECT * FROM programs");

	return programs;
}

async function getAllProgramsWithoutIds() {
	const { rows: programs } = await pool.query(
		"SELECT programs.id, programs.name, users.name AS user_name, goals.name AS goal_name, date_of_birth, anamnesis FROM programs JOIN users ON programs.user_id = users.id JOIN goals ON programs.goal_id = goals.id",
	);

	return programs;
}

async function postNewProgram(
	name,
	userId,
	goalId,
	startDate,
	numberOfCycles,
	cycleSize,
) {
	if (startDate === "") {
		await pool.query(
			"INSERT INTO programs (name, user_id, goal_id, number_of_cycles, cycle_size) VALUES ($1, $2, $3, $4, $5)",
			[name, userId, goalId, numberOfCycles, cycleSize],
		);

		return;
	}

	await pool.query(
		"INSERT INTO programs (name, user_id, goal_id, start_date, number_of_cycles, cycle_size) VALUES ($1, $2, $3, $4, $5, $6)",
		[name, userId, goalId, startDate, numberOfCycles, cycleSize],
	);
}

async function getProgramsByUserId(userId) {
	const { rows: programs } = await pool.query(
		"SELECT * FROM programs WHERE user_id = $1",
		[userId],
	);

	return programs;
}

export {
	getAllPrograms,
	postNewProgram,
	getAllProgramsWithoutIds,
	getProgramsByUserId,
};

import pool from "../pool.js";

async function getAll(db) {
	const { rows: programs } = await db.query("SELECT * FROM programs");

	return programs;
}

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

async function postNewProgram(name, userId, goalId, startDate) {
	if (startDate === "") {
		const { rows } = await pool.query(
			"INSERT INTO programs (name, user_id, goal_id) VALUES ($1, $2, $3) RETURNING id",
			[name, userId, goalId],
		);

		return rows[0].id;
	}

	const { rows } = await pool.query(
		"INSERT INTO programs (name, user_id, goal_id, start_date) VALUES ($1, $2, $3, $4) RETURNING id",
		[name, userId, goalId, startDate],
	);

	return rows[0].id;
}

async function getProgramById(db, { programId }) {
	const { rows: programs } = await db.query(
		"SELECT * FROM programs WHERE id = $1",
		[programId],
	);

	return programs?.[0];
}

async function getProgramsByUserId(db, { userId }) {
	const { rows: programs } = await db.query(
		"SELECT * FROM programs WHERE user_id = $1",
		[userId],
	);

	return programs;
}

async function verifyProgramExistence(programId) {
	const { rows: programExistence } = await pool.query(
		"SELECT COUNT(*) FROM programs WHERE id = $1",
		[Number(programId)],
	);

	return programExistence.length > 0;
}

export {
	getAllPrograms,
	postNewProgram,
	getAllProgramsWithoutIds,
	getProgramById,
	getProgramsByUserId,
	verifyProgramExistence,
	getAll,
};

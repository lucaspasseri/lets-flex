import pool from "../pool.js";

async function getAllUsers(db) {
	const { rows: users } = await db.query("SELECT * FROM users");

	return users;
}

async function verifyUserExistence(userId) {
	const { rows: userExistence } = await pool.query(
		"SELECT COUNT(*) FROM users WHERE id = $1",
		[Number(userId)],
	);

	return userExistence.length > 0;
}

async function getUserById(db, { userId }) {
	const { rows: users } = await db.query("SELECT * FROM users WHERE id = $1", [
		userId,
	]);

	return users?.[0];
}

async function postNewUser(db, { name, dob, anamnesis }) {
	if (dob === "") {
		const { rows } = await pool.query(
			"INSERT INTO users (name, anamnesis) VALUES ($1, $2) RETURNING id",
			[name, anamnesis],
		);

		return rows[0].id;
	}
	const { rows } = await pool.query(
		"INSERT INTO users (name, date_of_birth, anamnesis) VALUES ($1, $2, $3) RETURNING id",
		[name, dob, anamnesis],
	);

	return rows[0].id;
}

export { getAllUsers, postNewUser, verifyUserExistence, getUserById };

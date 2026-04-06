import pool from "../pool.js";

async function getAllUsers() {
	const { rows: users } = await pool.query("SELECT * FROM users");

	return users;
}

async function postNewUser(name, dob, anamnesis) {
	await pool.query(
		"INSERT INTO users (name, date_of_birth, anamnesis) VALUES ($1, $2, $3)",
		[name, dob, anamnesis],
	);
}

async function verifyUserExistence(userId) {
	const { rows: userExistence } = await pool.query(
		"SELECT COUNT(*) FROM users WHERE id = $1",
		[Number(userId)],
	);

	return userExistence.length > 0;
}

async function getUserById(userId) {
	const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
		Number(userId),
	]);

	const currentUser = rows[0];

	return currentUser;
}

export { getAllUsers, postNewUser, verifyUserExistence, getUserById };

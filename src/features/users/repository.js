import pool from "../../../db/pool.js";

export async function findAll(db = pool) {
	const { rows } = await db.query("SELECT * FROM users");

	return rows;
}

export async function findById({ userId }, db = pool) {
	const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [
		userId,
	]);

	return rows[0] ?? null;
}

export async function create({ name, dob, anamnesis }, db = pool) {
	if (dob === "") {
		const { rows } = await db.query(
			"INSERT INTO users (name, anamnesis) VALUES ($1, $2) RETURNING id",
			[name, anamnesis],
		);

		return rows[0] ?? null;
	}
	const { rows } = await db.query(
		"INSERT INTO users (name, date_of_birth, anamnesis) VALUES ($1, $2, $3) RETURNING id",
		[name, dob, anamnesis],
	);

	return rows[0] ?? null;
}

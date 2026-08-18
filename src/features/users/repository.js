import pool from "../../../db/pool.js";

/**
 * @typedef {import("./users.types.js").CreateUserInput} CreateUserInput
 * @typedef {import("./users.types.js").FindUserInput} FindUserInput
 * @typedef {import("./users.types.js").UserRow} UserRow
 */

/**
 * @returns {Promise<UserRow[]>}
 */

export async function findAll(db = pool) {
	const { rows } = await db.query("SELECT * FROM users");
	return rows;
}

/**
 * @param {FindUserInput} input
 * @returns {Promise<UserRow | null>}
 */

export async function findById({ userId }, db = pool) {
	const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [
		userId,
	]);

	return rows[0] ?? null;
}

/**
 * @param {CreateUserInput} input
 * @returns {Promise<UserRow | null>}
 */

export async function create({ name, dateOfBirth, anamnesis }, db = pool) {
	if (dateOfBirth === "") {
		const { rows } = await db.query(
			"INSERT INTO users (name, anamnesis) VALUES ($1, $2) RETURNING id",
			[name, anamnesis],
		);

		return rows[0] ?? null;
	}
	const { rows } = await db.query(
		"INSERT INTO users (name, date_of_birth, anamnesis) VALUES ($1, $2, $3) RETURNING id",
		[name, dateOfBirth, anamnesis],
	);

	return rows[0] ?? null;
}

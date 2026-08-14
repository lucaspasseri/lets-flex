import * as usersRepository from "./repository.js";

/**
 * @typedef {import("./users.types.js").User} User
 * @typedef {import("./users.types.js").CreateUserInput} CreateUserInput
 */

/**
 * @param {CreateUserInput} input
 * @returns {Promise<User>}
 */

async function createUser({ name, dateOfBirth, anamnesis }) {
	const user = await usersRepository.create({
		name,
		dateOfBirth,
		anamnesis,
	});

	return user;
}

export default createUser;

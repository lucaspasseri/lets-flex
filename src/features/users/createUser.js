import * as usersRepository from "./repository.js";
import { toLoggedUser } from "./mapper.js";

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
	if (!user) {
		throw new Error("User could not be created");
	}

	return toLoggedUser(user);
}

export default createUser;

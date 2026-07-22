import * as usersRepository from "./repository.js";

async function createUser({ name, dob, anamnesis }) {
	const user = await usersRepository.create({
		name,
		dob,
		anamnesis,
	});

	return user;
}

export default createUser;

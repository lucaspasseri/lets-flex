import * as usersRepository from "./repository.js";

async function setActiveUserAfterCreation({ name, dob, anamnesis }) {
	try {
		const user = await usersRepository.create({
			name,
			dob,
			anamnesis,
		});

		return user;
	} catch (err) {
		console.log(err);
	}
}

export default setActiveUserAfterCreation;

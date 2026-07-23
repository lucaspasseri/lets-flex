import * as programsRepository from "./repository.js";

async function createProgram({ name, userId, goalId, startDate }) {
	const program = await programsRepository.create({
		name,
		userId,
		goalId,
		startDate,
	});

	return program;
}

export default createProgram;

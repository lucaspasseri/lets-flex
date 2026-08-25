import * as programsRepository from "./repository.js";

export class ProgramNotFoundError extends Error {
	constructor() {
		super("Program not found");
		this.name = "ProgramNotFoundError";
	}
}

/** @param {{programId: number, userId: number}} input @param {{deleteByIdForUser: Function}} [repository] */
export default async function deleteProgram(input, repository = programsRepository) {
	const deleted = await repository.deleteByIdForUser(input);
	if (!deleted) throw new ProgramNotFoundError();
	return deleted;
}

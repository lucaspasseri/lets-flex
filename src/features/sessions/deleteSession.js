import * as sessionRepository from "./repository.js";

export class SessionTemplateNotDeletableError extends Error {
	constructor() {
		super("Session template not found or unavailable");
		this.name = "SessionTemplateNotDeletableError";
	}
}

/**
 * @param {{sessionId: number, ownerUserId: number}} input
 * @param {{deleteOrArchive: Function}} [repository]
 * @returns {Promise<"archived">}
 */
export default async function deleteSession(input, repository = sessionRepository) {
	const result = await repository.deleteOrArchive(input);
	if (!result) throw new SessionTemplateNotDeletableError();
	return result;
}

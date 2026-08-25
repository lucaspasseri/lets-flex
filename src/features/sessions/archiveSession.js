import * as sessionRepository from "./repository.js";

export class SessionTemplateNotArchivableError extends Error {
	constructor() {
		super("Session template not found or already archived");
		this.name = "SessionTemplateNotArchivableError";
	}
}

/** @param {number} sessionId @param {any} repository */
async function archiveSession(sessionId, repository = sessionRepository) {
	const archived = await repository.archive({ sessionId });
	if (!archived) throw new SessionTemplateNotArchivableError();
}

export default archiveSession;

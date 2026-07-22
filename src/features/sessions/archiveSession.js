import * as sessionRepository from "./repository.js";

async function archiveSession(sessionId) {
	await sessionRepository.archive({ sessionId });
}

export default archiveSession;

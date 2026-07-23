import asyncHandler from "../../../utils/asyncControllerHandler.js";
import createSession from "../../features/sessions/createSession.js";
import archiveSession from "../../features/sessions/archiveSession.js";

async function create(req, res) {
	const { name, notes, stepRow } = req.body;

	await createSession({ name, notes, stepRowArr: stepRow });

	res.redirect("/library");
}

async function archive(req, res) {
	const { sessionId } = req.params;

	await archiveSession(sessionId);

	res.redirect("/library");
}

export const sessionController = {
	create: asyncHandler(create),
	archive: asyncHandler(archive),
};

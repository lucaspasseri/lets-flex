import asyncHandler from "../../../utils/asyncControllerHandler.js";
import createSession from "../../features/sessions/createSession.js";
import archiveSession, {
	SessionTemplateNotArchivableError,
} from "../../features/sessions/archiveSession.js";
import updateSessionTemplate, {
	SessionTemplateNotFoundError,
} from "../../features/sessions/updateSessionTemplate.js";
import { renderLibrary } from "./libraryController.js";

/** @typedef {import("express").Request & {validatedBody?: any, validatedParams?: any}} Request */
/** @typedef {import("express").Response} Response */
/** @typedef {import("../../../middlewares/validateRequestBody.js").InvalidBodyResult} InvalidBodyResult */

/** @param {Request & {validatedBody?: any}} req @param {Response} res */
async function create(req, res) {
	const { name, notes, stepRow } = req.validatedBody;

	await createSession({ name, notes, stepRowArr: stepRow });

	res.redirect("/library");
}

/** @param {Request} req @param {Response} res @param {InvalidBodyResult} result */
async function showCreateErrors(req, res, { errors, submittedValues }) {
	res.status(422);
	await renderLibrary(req, res, {
		sessionTemplateFormState: {
			mode: "create",
			open: true,
			values:
				submittedValues && typeof submittedValues === "object" ? submittedValues : {},
			errors,
		},
	});
}

/** @param {Request} req @param {Response} res */
async function archive(req, res) {
	const { sessionId } = req.validatedParams;

	try {
		await archiveSession(sessionId);
	} catch (error) {
		if (error instanceof SessionTemplateNotArchivableError) {
			res.status(404).send("Session template not found or already archived");
			return;
		}
		throw error;
	}

	res.redirect("/library");
}

/** @param {Request & {validatedBody?: any}} req @param {Response} res */
async function update(req, res) {
	const { sessionId } = req.validatedParams;
	try {
		await updateSessionTemplate({ ...req.validatedBody, sessionId });
	} catch (error) {
		if (error instanceof SessionTemplateNotFoundError) {
			res.status(404).send("Session template not found");
			return;
		}
		throw error;
	}
	res.redirect(`/library?sessionId=${sessionId}#session-details-title-${sessionId}`);
}

/** @param {Request} req @param {Response} res @param {InvalidBodyResult} result */
async function showUpdateErrors(req, res, { errors, submittedValues }) {
	res.status(422);
	await renderLibrary(req, res, {
		sessionTemplateFormState: {
			mode: "update",
			open: true,
			sessionId: req.params.sessionId,
			values:
				submittedValues && typeof submittedValues === "object" ? submittedValues : {},
			errors,
		},
	});
}

export const sessionController = {
	create: asyncHandler(create),
	showCreateErrors,
	update: asyncHandler(update),
	showUpdateErrors,
	archive: asyncHandler(archive),
};

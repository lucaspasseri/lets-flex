import asyncHandler from "../../../utils/asyncControllerHandler.js";
import createCycle from "../../features/cycles/createCycle.js";
import toNullableNumber from "../../../utils/toNullableNumber.js";

/**
 * @typedef {import("express").Request & {session: {state?: Record<string, unknown>}}} Request
 * @typedef {import("express").Response} Response
 */

/** @param {Request} req @param {Response} res */
async function create(req, res) {
	const programId = toNullableNumber(req.session?.state?.programId);
	const { name, cycleSize, cycleOrder } = req.body;

	if (programId === null) {
		throw new Error("An active program is required to create a cycle");
	}

	const cycleId = await createCycle({
		programId,
		name,
		cycleSize,
		cycleOrder,
	});

	req.session.state = { ...req.session.state, programId, cycleId };
	res.redirect("/programs");
}

export const cycleController = {
	create: asyncHandler(create),
};

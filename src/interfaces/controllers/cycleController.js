import asyncHandler from "../../../utils/asyncControllerHandler.js";
import createCycle, {
	CycleOrderOutOfRangeError,
} from "../../features/cycles/createCycle.js";
import toNullableNumber from "../../../utils/toNullableNumber.js";
import { renderPrograms } from "./programController.js";

/**
 * @typedef {import("express").Request & {session: {state?: Record<string, unknown>}, validatedBody?: Record<string, unknown>}} Request
 * @typedef {import("express").Response} Response
 */

/** @param {Request} req @param {Response} res */
async function create(req, res) {
	const programId = toNullableNumber(req.session?.state?.programId);

	if (programId === null) {
		res.status(422);
		await renderPrograms(req, res, {
			cycleFormState: {
				open: true,
				values: req.body,
				errors: {
					fieldErrors: {},
					formErrors: ["Choose an active program before creating a cycle."],
				},
			},
		});
		return;
	}

	let cycleId;
	try {
		const validatedBody =
			/** @type {{name: string, cycleSize: number, cycleOrder: number}} */ (
				req.validatedBody
			);
		cycleId = await createCycle({
			programId,
			...validatedBody,
		});
	} catch (error) {
		if (error instanceof CycleOrderOutOfRangeError) {
			res.status(422);
			await renderPrograms(req, res, {
				cycleFormState: {
					open: true,
					values: req.body,
					errors: {
						fieldErrors: { cycleOrder: error.message },
						formErrors: [],
					},
				},
			});
			return;
		}
		throw error;
	}

	req.session.state = { ...req.session.state, programId, cycleId };
	res.redirect("/programs");
}

async function showCreateErrors(req, res, { errors, submittedValues }) {
	res.status(422);
	await renderPrograms(req, res, {
		cycleFormState: {
			open: true,
			values:
				submittedValues && typeof submittedValues === "object" ? submittedValues : {},
			errors,
		},
	});
}

export const cycleController = {
	create: asyncHandler(create),
	showCreateErrors,
};

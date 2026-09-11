import asyncHandler from "../../../utils/asyncControllerHandler.js";
import createCycle, {
	CycleOrderOutOfRangeError,
} from "../../features/cycles/createCycle.js";
import toNullableNumber from "../../../utils/toNullableNumber.js";
import { renderPrograms } from "./programController.js";
import deleteCycle, { CycleNotFoundError } from "../../features/cycles/deleteCycle.js";
import respondWithContextualMutationError from "../contextualMutationError.js";

/**
 * @typedef {import("express").Request & {session: {state?: Record<string, unknown>}, validatedBody?: Record<string, unknown>}} Request
 * @typedef {import("express").Response} Response
 */

/** @param {Request} req @param {Response} res */
async function create(req, res) {
	const programId = toNullableNumber(req.session?.state?.programId);
	// @ts-ignore -- application Passport principal.
	const userId = toNullableNumber(req.user?.id);

	if (programId === null || userId === null) {
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
			userId,
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

async function destroy(req, res) {
	const cycleId = toNullableNumber(req.validatedParams?.cycleId ?? req.params.cycleId);
	// @ts-ignore -- application Passport principal.
	const userId = toNullableNumber(req.user?.id);
	if (cycleId === null || !Number.isInteger(cycleId) || cycleId <= 0) {
		await respondWithContextualMutationError(req, res, {
			status: 400,
			fallbackMessage: "Invalid cycle ID",
			render: () =>
				renderPrograms(req, res, {
					pageFeedback: {
						id: "programs-page-feedback-title",
						title: "Cycle not deleted",
						message: "Refresh Programs and choose the cycle again.",
					},
				}),
		});
		return;
	}
	if (userId === null || !Number.isInteger(userId) || userId <= 0) {
		await respondWithContextualMutationError(req, res, {
			status: 403,
			fallbackMessage: "Choose an active profile before deleting a cycle",
			render: () =>
				renderPrograms(req, res, {
					pageFeedback: {
						id: "programs-page-feedback-title",
						title: "Cycle not deleted",
						message: "Choose an active profile before deleting a cycle.",
					},
				}),
		});
		return;
	}

	try {
		await deleteCycle({ cycleId, userId });
	} catch (error) {
		if (error instanceof CycleNotFoundError) {
			await respondWithContextualMutationError(req, res, {
				status: 404,
				fallbackMessage: "Cycle not found",
				render: () =>
					renderPrograms(req, res, {
						pageFeedback: {
							id: "programs-page-feedback-title",
							title: "Cycle not deleted",
							message:
								"That cycle is no longer available. Refresh Programs to see the current plan.",
						},
					}),
			});
			return;
		}
		throw error;
	}

	if (toNullableNumber(req.session.state?.cycleId) === cycleId) {
		req.session.state = { ...req.session.state, cycleId: null };
	}
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
	delete: asyncHandler(destroy),
	showCreateErrors,
};

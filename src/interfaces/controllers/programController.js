import asyncHandler from "../../../utils/asyncControllerHandler.js";
import toNullableNumber from "../../../utils/toNullableNumber.js";
import createProgram from "../../features/programs/createProgram.js";
import createProgramsPageViewModel from "../../../views/viewModels/programsPage/createProgramsPageViewModel.js";
import { getProgramsPageData } from "../../features/programs/getProgramsPageData.js";
import deleteProgram, {
	ProgramNotFoundError,
} from "../../features/programs/deleteProgram.js";
import respondWithContextualMutationError from "../contextualMutationError.js";

/**
 * @typedef {import("express").Request & {session: {state?: Record<string, unknown>}, validatedBody?: Record<string, unknown>}} Request
 * @typedef {import("express").Response} Response
 */

/**
 * @param {Request} req
 * @param {Response} res
 */

async function show(req, res) {
	await renderPrograms(req, res);
}

/**
 * @param {Request} req
 * @param {Response} res
 * @param {{programFormState?: Record<string, any>, cycleFormState?: Record<string, any>, pageFeedback?: {tone?: string, eyebrow?: string, id?: string, title: string, message: string} | null}} [formState]
 */
export async function renderPrograms(req, res, formState = {}) {
	const sessionState = res.locals?.sessionState;
	// @ts-ignore -- application Passport principal.
	const userId = toNullableNumber(req.user?.id);
	const programIdSelection =
		toNullableNumber(req?.query?.programId) ??
		toNullableNumber(sessionState?.programId);
	const cycleIdSelection =
		toNullableNumber(req?.query?.cycleId) ?? toNullableNumber(sessionState?.cycleId);

	const data = await getProgramsPageData({
		userId,
		programId: programIdSelection,
		cycleId: cycleIdSelection,
	});

	const { programs, cycles } = data;

	const programId = programs?.current?.id ?? null;
	const cycleId = cycles?.current?.id ?? null;

	req.session.state = {
		...req.session.state,
		programId,
		cycleId,
	};

	const page = res.locals.page;
	const pageState = { userId, programId, cycleId };
	const programsPage = createProgramsPageViewModel({
		page,
		pageState,
		data,
		...formState,
	});

	res.render("programs", programsPage);
}

/**
 * @param {Request} req
 * @param {Response} res
 */

async function create(req, res) {
	// @ts-ignore -- application Passport principal.
	const userId = toNullableNumber(req.user?.id);

	if (userId === null) {
		res.status(422);
		await renderPrograms(req, res, {
			programFormState: {
				open: true,
				values: req.body,
				errors: {
					fieldErrors: {},
					formErrors: ["Choose an active profile before creating a program."],
				},
			},
		});
		return;
	}

	const validatedBody =
		/** @type {{name: string, goalId: number, startDate: string}} */ (
			req.validatedBody
		);
	const program = await createProgram({
		...validatedBody,
		userId,
	});

	req.session.state = {
		...req.session.state,
		programId: program?.id ?? null,
		cycleId: null,
	};
	res.redirect("/programs");
}

async function destroy(req, res) {
	const programId = toNullableNumber(
		req.validatedParams?.programId ?? req.params.programId,
	);
	// @ts-ignore -- application Passport principal.
	const userId = toNullableNumber(req.user?.id);
	if (programId === null || !Number.isInteger(programId) || programId <= 0) {
		await respondWithContextualMutationError(req, res, {
			status: 400,
			fallbackMessage: "Invalid program ID",
			render: () =>
				renderPrograms(req, res, {
					pageFeedback: {
						id: "programs-page-feedback-title",
						title: "Program not deleted",
						message: "Refresh Programs and choose the program again.",
					},
				}),
		});
		return;
	}
	if (userId === null || !Number.isInteger(userId) || userId <= 0) {
		await respondWithContextualMutationError(req, res, {
			status: 403,
			fallbackMessage: "Choose an active profile before deleting a program",
			render: () =>
				renderPrograms(req, res, {
					pageFeedback: {
						id: "programs-page-feedback-title",
						title: "Program not deleted",
						message: "Choose an active profile before deleting a program.",
					},
				}),
		});
		return;
	}

	try {
		await deleteProgram({ programId, userId });
	} catch (error) {
		if (error instanceof ProgramNotFoundError) {
			await respondWithContextualMutationError(req, res, {
				status: 404,
				fallbackMessage: "Program not found",
				render: () =>
					renderPrograms(req, res, {
						pageFeedback: {
							id: "programs-page-feedback-title",
							title: "Program not deleted",
							message:
								"That program is no longer available. Refresh Programs to see the current plan.",
						},
					}),
			});
			return;
		}
		throw error;
	}

	if (toNullableNumber(req.session.state?.programId) === programId) {
		req.session.state = { ...req.session.state, programId: null, cycleId: null };
	}
	res.redirect("/programs");
}

async function showCreateErrors(req, res, { errors, submittedValues }) {
	res.status(422);
	await renderPrograms(req, res, {
		programFormState: {
			open: true,
			values:
				submittedValues && typeof submittedValues === "object" ? submittedValues : {},
			errors,
		},
	});
}

export const programsController = {
	show: asyncHandler(show),
	create: asyncHandler(create),
	delete: asyncHandler(destroy),
	showCreateErrors,
};

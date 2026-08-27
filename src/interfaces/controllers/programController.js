import asyncHandler from "../../../utils/asyncControllerHandler.js";
import toNullableNumber from "../../../utils/toNullableNumber.js";
import createProgram from "../../features/programs/createProgram.js";
import createProgramsPageViewModel from "../../../views/viewModels/programsPage/createProgramsPageViewModel.js";
import { getProgramsPageData } from "../../features/programs/getProgramsPageData.js";
import deleteProgram, {
	ProgramNotFoundError,
} from "../../features/programs/deleteProgram.js";

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
 * @param {{programFormState?: Record<string, any>, cycleFormState?: Record<string, any>}} [formState]
 */
export async function renderPrograms(req, res, formState = {}) {
	const sessionState = res.locals?.sessionState;
	const userId = toNullableNumber(sessionState?.userId);
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

	const page = { ...res.locals.page, title: "Let's Flex!" };
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
	const userId = toNullableNumber(res.locals?.sessionState?.userId);

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
	const userId = toNullableNumber(res.locals?.sessionState?.userId);
	if (programId === null || !Number.isInteger(programId) || programId <= 0) {
		res.status(400).send("Invalid program ID");
		return;
	}
	if (userId === null || !Number.isInteger(userId) || userId <= 0) {
		res.status(403).send("Choose an active profile before deleting a program");
		return;
	}

	try {
		await deleteProgram({ programId, userId });
	} catch (error) {
		if (error instanceof ProgramNotFoundError) {
			res.status(404).send("Program not found");
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

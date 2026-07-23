import asyncHandler from "../../../utils/asyncControllerHandler.js";
import createProgram from "../../features/programs/createProgram.js";
import { getProgramsPage } from "../../features/programs/getProgramsPage.js";

async function show(req, res, next) {
	try {
		const { pageState, appState, data } = await getProgramsPage({
			query: req.query,
			sessionState: res.locals.sessionState,
		});

		req.session.state = {
			...req.session.state,
			programId: appState?.program?.id ?? null,
			cycleId: appState?.cycle?.id ?? null,
		};

		const programs = {
			page: { ...res.locals.page, title: "Let's Flex!" },
			pageState,
			appState,
			data,
		};

		res.render("programs", programs);
	} catch (err) {
		next(err);
	}
}

async function create(req, res) {
	const { name, userId, goalId, startDate } = req.body;
	const program = await createProgram({
		name,
		userId,
		goalId,
		startDate,
	});

	req.session.state = { ...req.session.state, programId: program?.id };
	res.redirect("/programs");
}

export const programsController = {
	show: asyncHandler(show),
	create: asyncHandler(create),
};

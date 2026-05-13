const getProgramsPageParams = async (req, res, next) => {
	const { programId } = req.params;
	const { cycleId } = req.query;

	res.locals.programsPageParams ??= {};

	res.locals.programsPageParams = {
		programId,
		cycleId,
	};

	next();
};

export { getProgramsPageParams };

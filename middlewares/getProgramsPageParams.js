const getProgramsPageParams = async (req, res, next) => {
	const { programId, cycleId } = req.query;

	res.locals.programsPageParams ??= {};

	res.locals.programsPageParams = {
		programId,
		cycleId,
	};

	next();
};

export { getProgramsPageParams };

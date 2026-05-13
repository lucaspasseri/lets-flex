const getProgramsPageParams = async (req, res, next) => {
	const { programId } = req.params;
	const { cycleId } = req.query;

	console.log({ programId, cycleId });

	res.locals.programsPageParams ??= {};

	res.locals.programsPageParams = {
		programId,
		cycleId,
	};

	next();
};

export { getProgramsPageParams };

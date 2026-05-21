const getProgramsPageParams = async (req, res, next) => {
	res.locals.programsPageParams = {
		programId: req.query?.programId ? Number(req.query.programId) : null,
		cycleId: req.query?.cycleId ? Number(req.query.cycleId) : null,
	};

	next();
};

export { getProgramsPageParams };

const getLibraryPageParams = async (req, res, next) => {
	res.locals.libraryPageParams = {
		sessionId: req.query?.sessionId ? Number(req.query.sessionId) : null,
	};

	next();
};

export { getLibraryPageParams };

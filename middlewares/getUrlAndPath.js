const getUrlAndPath = async (req, res, next) => {
	res.locals.page = {
		path: req.path,
		url: req.originalUrl,
		backUrl: req.get("Referrer") || "/",
	};
	next();
};

export { getUrlAndPath };

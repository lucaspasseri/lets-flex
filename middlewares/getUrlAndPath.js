const getUrlAndPath = async (req, res, next) => {
	res.locals.path = req.path;
	res.locals.url = req.originalUrl;
	res.locals.backUrl = req.get("Referrer") || "/";
	next();
};

export { getUrlAndPath };

const getUrlAndPath = async (req, res, next) => {
	res.locals.path = req.path;
	res.locals.url = req.originalUrl;
	next();
};

export { getUrlAndPath };

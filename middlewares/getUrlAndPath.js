const getUrlAndPath = async (req, res, next) => {
	const referer = req.get("Referer");

	res.locals.page = {
		path: req.path,
		url: req.originalUrl,
		backUrl: referer || "/",
		backUrlWithoutParams: referer ? new URL(referer).pathname : "/",
	};
	next();
};

export { getUrlAndPath };

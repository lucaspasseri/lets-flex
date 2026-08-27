const getUrlAndPath = async (req, res, next) => {
	const referer = req.get("Referer");
	let backUrl = "/";

	if (referer) {
		try {
			const parsed = new URL(referer);
			if (parsed.host === req.get("host")) {
				backUrl = `${parsed.pathname}${parsed.search}${parsed.hash}`;
			}
		} catch {
			// Invalid and external referrers deliberately fall back to the home page.
		}
	}

	res.locals.page = {
		path: req.path,
		url: req.originalUrl,
		backUrl,
		backUrlWithoutParams: new URL(backUrl, "http://localhost").pathname,
	};
	next();
};

export { getUrlAndPath };

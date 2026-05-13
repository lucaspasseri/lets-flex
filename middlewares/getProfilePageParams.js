const getProfilePageParams = async (req, res, next) => {
	res.locals.profilePageParams = {
		userId: req.query.userId ? Number(req.query.userId) : null,
	};

	next();
};

export { getProfilePageParams };

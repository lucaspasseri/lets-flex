import * as usersDb from "../db/users/index.js";

const getCurrentUser = async (req, res, next) => {
	try {
		const userId = req.session?.state && req.session.state?.userId;

		if (!userId) {
			res.locals.currentUser = null;
			return next();
		}

		const currentUser = await usersDb.getUserById(Number(userId));

		res.locals.currentUser = currentUser;
		next();
	} catch (err) {
		next(err);
	}
};

export { getCurrentUser };

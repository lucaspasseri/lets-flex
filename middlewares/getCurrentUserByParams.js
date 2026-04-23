import * as usersDb from "../db/users/index.js";

const getCurrentUserByParams = async (req, res, next) => {
	try {
		let userId = null;
		userId = req.params?.userId || null;

		if (!userId) {
			userId = (req.session?.state && req.session.state?.userId) || null;
		}

		if (!userId) {
			res.locals.currentUser = null;
			return next();
		}

		const userExist = await usersDb.verifyUserExistence(Number(userId));

		if (!userExist) {
			res.locals.currentUser = null;
			return next();
		}

		const currentUser = await usersDb.getUserById(Number(userId));
		req.session.state = { ...req.session.state, userId };
		res.locals.currentUser = currentUser;
		next();
	} catch (err) {
		next(err);
	}
};

export { getCurrentUserByParams };

import * as usersDb from "../db/users/index.js";

const getCurrentUser = async (req, res, next) => {
	console.log("middleware");

	try {
		const userId = req.session?.userId;

		console.log({ s: req.session, userId });

		if (!userId) {
			res.locals.currentUser = null;
			return next();
		}

		const currentUser = await usersDb.getUserById(Number(userId));

		console.log({ currentUser });

		res.locals.currentUser = currentUser;
		next();
	} catch (err) {
		next(err);
	}
};

export { getCurrentUser };

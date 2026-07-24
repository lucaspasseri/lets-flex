import * as userDb from "../../db/users/index.js";

const loadProfilePageData = async (req, res, next) => {
	const userArr = await userDb.getAllUsers();
	res.locals.data = { ...res.locals.data, userArr };

	next();
};

export { loadProfilePageData };

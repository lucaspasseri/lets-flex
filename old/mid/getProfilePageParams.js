import toNullableNumber from "../../utils/toNullableNumber.js";

const getProfilePageParams = async (req, res, next) => {
	res.locals.profilePageParams = {
		userId: toNullableNumber(req.query.userId),
	};

	next();
};

export { getProfilePageParams };

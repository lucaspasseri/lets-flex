const getDifferenceInCalendarDays = async (req, res, next) => {
	const { daysDifference } = req.params;

	req.session.state = { ...req.session.state, daysDifference };
	next();
};

export { getDifferenceInCalendarDays };

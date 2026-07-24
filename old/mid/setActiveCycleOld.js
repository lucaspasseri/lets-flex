import { addDays, differenceInCalendarDays } from "date-fns";
import toNullableNumber from "../../utils/toNullableNumber.js";

const getActiveCycleId = (startDate, currDay, daysDifference, cycleArr) => {
	const currDifference = toNullableNumber(daysDifference);
	const relativeDay = currDifference
		? addDays(currDay, currDifference)
		: currDay;

	if (differenceInCalendarDays(relativeDay, startDate) < 0) {
		return null;
	}

	let lastDate = startDate;
	for (let i = 0; i < cycleArr.length; i++) {
		const { id, cycle_size } = cycleArr[i];

		if (
			differenceInCalendarDays(addDays(lastDate, cycle_size), relativeDay) > 0
		) {
			return id;
		}

		lastDate = addDays(lastDate, cycle_size);
	}

	return null;
};

const setActiveCycle = async (req, res, next) => {
	const { daysDifference } = res.locals.dashboardPageParams;
	const { currentProgram } = res.locals.appState;
	const { cycleArr } = res.locals.data;

	const currDay = new Date();
	const startDate = currentProgram?.start_date
		? currentProgram.start_date
		: null;

	let activeCycleId;

	if (currentProgram?.start_date !== undefined && cycleArr.length > 0) {
		activeCycleId = getActiveCycleId(
			startDate,
			currDay,
			daysDifference,
			cycleArr,
		);
	}

	res.locals.sessionState.activeCycleId = activeCycleId;

	next();
};

export { setActiveCycle };

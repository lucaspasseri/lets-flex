import { addDays, differenceInCalendarDays } from "date-fns";
import toNullableNumber from "../../utils/toNullableNumber.js";

const getActiveCycleId = (startDate, activeDay, cycleArr) => {
	let comparingDate = startDate;
	for (let i = 0; i < cycleArr.length; i++) {
		const { id, cycle_size } = cycleArr[i];

		if (
			differenceInCalendarDays(addDays(comparingDate, cycle_size), activeDay) >
			0
		) {
			return id;
		}

		comparingDate = addDays(comparingDate, cycle_size);
	}

	return null;
};

const setActiveCycle = async (req, res, next) => {
	const { activeDay } = res.locals.sessionState;
	const { currentProgram } = res.locals.appState;
	const { cycleArr } = res.locals.data;

	const currDay = new Date();
	const startDate = currentProgram?.start_date
		? currentProgram.start_date
		: null;

	let activeCycleId;

	if (currentProgram?.start_date !== undefined && cycleArr.length > 0) {
		activeCycleId = getActiveCycleId(startDate, activeDay, cycleArr);
	}

	res.locals.sessionState.activeCycleId = activeCycleId;

	next();
};

export { setActiveCycle };

import {
	addDays,
	startOfWeek,
	differenceInCalendarDays,
	format,
	isSameDay,
	getWeek,
} from "date-fns";
import range from "../../../utils/range.js";

function getBarChartData(startDate, cycleArr, workoutSessionArr) {
	const totalDaysInTheProgram = cycleArr.reduce((acc, curr) => {
		acc += curr.cycle_size;

		return acc;
	}, 0);

	let daysLeft = totalDaysInTheProgram;
	let currDay = startDate;
	const weekDayArr = [];

	while (daysLeft > 0) {
		const firstDayOfTheWeek = startOfWeek(currDay);

		weekDayArr.push(firstDayOfTheWeek);
		currDay = addDays(currDay, 7);
		daysLeft -= 7;
	}

	const scheduledCountArr = [];
	const finishedCountArr = [];
	const formattedWeekDayArr = [];

	weekDayArr.forEach(date => {
		const workoutSessionScheduledInTheCurrentWeek = workoutSessionArr.filter(
			ws => getWeek(date) === getWeek(ws.scheduled_date),
		);

		const workoutSessionFinishedInTheCurrentWeek = workoutSessionArr.filter(
			ws => getWeek(date) === getWeek(ws.finished_at),
		);

		scheduledCountArr.push(workoutSessionScheduledInTheCurrentWeek.length);
		finishedCountArr.push(workoutSessionFinishedInTheCurrentWeek.length);
		formattedWeekDayArr.push(format(date, "dd/MM"));
	});

	return { weekArr: formattedWeekDayArr, scheduledCountArr, finishedCountArr };
}

export default getBarChartData;

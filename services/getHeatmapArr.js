import {
	addDays,
	startOfWeek,
	differenceInCalendarDays,
	format,
	isSameDay,
} from "date-fns";
import range from "../utils/range.js";

function getHeatmapArr(startDate, cycleArr, workoutSessionArr) {
	let lastCycleDayIndex = 0;
	const heatMapArr = cycleArr.map(cycle => {
		const cycleName = cycle.name;
		const cycleSize = cycle.cycle_size;

		const currCycleDayArr = range(cycleSize).map(index => {
			const currDay = addDays(startDate, lastCycleDayIndex + index);
			let offset = null;

			if (index === 0) {
				const startWeekDay = startOfWeek(currDay);
				offset = differenceInCalendarDays(currDay, startWeekDay);
			}

			if (index === cycleSize - 1) {
				lastCycleDayIndex += cycleSize;
			}

			const numberOfFinishedWorkoutSession = workoutSessionArr.filter(
				ws => ws.finished_at && isSameDay(currDay, ws.finished_at),
			).length;

			const cellClass =
				numberOfFinishedWorkoutSession === 0
					? "no-workout-session"
					: numberOfFinishedWorkoutSession === 1
						? "one-workout-session"
						: "many-workout-session";

			return {
				currDay: format(currDay, "dd/MM"),
				offset,
				cellClass,
			};
		});

		return {
			cycleName,
			cycleDayArr: currCycleDayArr,
		};
	});

	return heatMapArr;
}

export { getHeatmapArr };

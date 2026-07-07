const canvas = document.getElementById("test-canvas");

const sessionArrContainer = document.querySelector(
	"[data-workout-session-array]",
);

const stringifyArr = sessionArrContainer.dataset.workoutSessionArray;
const workoutSessionArr = JSON.parse(stringifyArr);

function getStartOfWeek(year, week) {
	const options = {
		weekStartsOn: 1,
		firstWeekContainsDate: 4,
	};
	const referenceDate = new Date(year, 0, 1);
	const date = dateFns.setWeek(referenceDate, week, options);

	return dateFns.startOfWeek(date, options);
}

const prepareArr = arr => {
	const reg = {};

	arr.forEach(item => {
		const date = new Date(item.finished_at);

		const week = dateFns.getISOWeek(date);
		const year = dateFns.getISOWeekYear(date);

		const key = `${year}-${week}`;

		reg[key] = (reg[key] ?? 0) + 1;
	});

	return Object.entries(reg).map(([key, count]) => {
		const [year, week] = key.split("-").map(Number);

		const startWeekDay = getStartOfWeek(year, week);

		return {
			week: dateFns.format(startWeekDay, "dd/MM"),
			count,
		};
	});
};

const preparedArr = prepareArr(workoutSessionArr);

if (canvas) {
	new Chart(canvas, {
		type: "bar",
		data: {
			labels: preparedArr.map(row => row.week),
			datasets: [
				{
					label: "Workout Sessions Per Week",
					data: preparedArr.map(row => row.count),
				},
			],
		},
	});
}
